
import { GoogleGenAI } from "@google/genai";
import { AreaScore, Child, AssessmentItem } from "../types";

export const generateAssessmentReport = async (child: Child, latestScores: AreaScore[], contributors: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const scoresText = latestScores
    .map(s => `${s.label}: ${s.percentage.toFixed(1)}% (${s.score}/${s.total})`)
    .join('\n');

  const teamText = contributors.length > 0 ? `Equipe multiprofissional envolvida: ${contributors.join(', ')}.` : "";

  const conditionContext = child.condition && child.condition !== 'Nenhum' 
    ? `A criança possui o diagnóstico de: ${child.condition}. Adapte suas sugestões e análise considerando as características típicas desta condição (ex: hipotonia muscular, atrasos na fala, ou forças específicas).`
    : "";

  const prompt = `
    Como um especialista sênior em desenvolvimento infantil e neurodiversidade, analise os resultados do Inventário Portage da criança abaixo:
    
    Nome: ${child.name}
    Idade: ${calculateAge(child.birthDate)}
    Diagnóstico/Condição: ${child.condition || 'Não especificado'}
    Histórico: ${child.clinicalHistory}
    
    ${teamText}
    ${conditionContext}
    
    Resultados por Área:
    ${scoresText}
    
    Por favor, forneça um relatório clínico detalhado seguindo esta estrutura:
    1. **Perfil Geral**: Análise do desempenho atual frente à idade cronológica.
    2. **Análise por Área**: Destaque o que foi alcançado e o que está em fase de emersão.
    3. **Adaptações Específicas**: Como o diagnóstico influencia estes resultados? Que adaptações são necessárias?
    4. **Plano de Estimulação**: 5 atividades práticas e lúdicas focando nas áreas de maior defasagem.
    
    Responda em Português formatado em Markdown rico. Use negrito para dar ênfase.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating report:", error);
    return "Não foi possível gerar a análise automática no momento.";
  }
};

function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years} anos e ${months} meses`;
}
