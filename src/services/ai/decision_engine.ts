export type RecommendationType = 
  | "none"
  | "ask_community"
  | "get_expert_advice"
  | "request_consultation";

export interface DecisionInputs {
  confidence?: number;
  diseaseName?: string;
  isAmbiguous?: boolean;
  historyLength: number;
  userQuestion: string;
  expertAvailable: boolean;
  isRepeatedIssue?: boolean;
  hasTreatmentFailure?: boolean;
}

export interface DecisionResult {
  recommendation: RecommendationType;
  score: number;
  reason: string;
}

const RARE_DISEASES = ["citrus_greening", "bacterial_wilt", "fusarium_wilt"];

export const evaluateRecommendation = (inputs: DecisionInputs): DecisionResult => {
  let communityScore = 0;
  let expertScore = 0;
  let consultationScore = 0;
  let noRecScore = 0;

  const conf = inputs.confidence ?? 1.0;
  const qLower = inputs.userQuestion.toLowerCase();

  // 1. Check for Treatment Failure
  const treatmentFailureWords = ["not working", "dying", "getting worse", "failed", "still sick", "no improvement"];
  const hasFailure = inputs.hasTreatmentFailure || treatmentFailureWords.some(w => qLower.includes(w));
  if (hasFailure) {
    consultationScore += 3;
    expertScore += 2;
    communityScore += 1;
  }

  // 2. Check for Repeated Issues
  if (inputs.isRepeatedIssue || inputs.historyLength > 10) {
    expertScore += 3;
    consultationScore += 1;
  }

  // 3. Rare Disease
  if (inputs.diseaseName && RARE_DISEASES.some(d => inputs.diseaseName!.toLowerCase().includes(d.toLowerCase()))) {
    consultationScore += 4;
    expertScore += 2;
  }

  // 4. Ambiguity / Low Confidence
  if (inputs.isAmbiguous || conf < 0.5) {
    communityScore += 3;
    expertScore += 1;
  } else if (conf < 0.7) {
    communityScore += 2;
  } else if (conf > 0.85 && !hasFailure && !inputs.isRepeatedIssue) {
    noRecScore += 5;
  }

  // 5. Expert Availability
  if (!inputs.expertAvailable) {
    expertScore -= 5;
    consultationScore -= 5;
  }

  // Determine Winner
  let winner: RecommendationType = "none";
  let maxScore = noRecScore;
  let reason = "High confidence diagnosis; no escalation needed.";

  if (consultationScore > maxScore && consultationScore >= 4) {
    winner = "request_consultation";
    maxScore = consultationScore;
    reason = "Critical/Rare issue or treatment failure detected.";
  } else if (expertScore > maxScore && expertScore >= 3) {
    winner = "get_expert_advice";
    maxScore = expertScore;
    reason = "Repeated issue or moderate severity requires expert attention.";
  } else if (communityScore > maxScore && communityScore >= 2) {
    winner = "ask_community";
    maxScore = communityScore;
    reason = "Low confidence or ambiguity; community input valuable.";
  }

  return {
    recommendation: winner,
    score: maxScore,
    reason
  };
};


