"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateRecommendation = void 0;
var RARE_DISEASES = ["citrus_greening", "bacterial_wilt", "fusarium_wilt"];
var evaluateRecommendation = function (inputs) {
    var _a;
    var communityScore = 0;
    var expertScore = 0;
    var consultationScore = 0;
    var noRecScore = 0;
    var conf = (_a = inputs.confidence) !== null && _a !== void 0 ? _a : 1.0;
    var qLower = inputs.userQuestion.toLowerCase();
    // 1. Check for Treatment Failure
    var treatmentFailureWords = ["not working", "dying", "getting worse", "failed", "still sick", "no improvement"];
    var hasFailure = inputs.hasTreatmentFailure || treatmentFailureWords.some(function (w) { return qLower.includes(w); });
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
    if (inputs.diseaseName && RARE_DISEASES.some(function (d) { return inputs.diseaseName.toLowerCase().includes(d.toLowerCase()); })) {
        consultationScore += 4;
        expertScore += 2;
    }
    // 4. Ambiguity / Low Confidence
    if (inputs.isAmbiguous || conf < 0.5) {
        communityScore += 3;
        expertScore += 1;
    }
    else if (conf < 0.7) {
        communityScore += 2;
    }
    else if (conf > 0.85 && !hasFailure && !inputs.isRepeatedIssue) {
        noRecScore += 5;
    }
    // 5. Expert Availability
    if (!inputs.expertAvailable) {
        expertScore -= 5;
        consultationScore -= 5;
    }
    // Determine Winner
    var winner = "none";
    var maxScore = noRecScore;
    var reason = "High confidence diagnosis; no escalation needed.";
    if (consultationScore > maxScore && consultationScore >= 4) {
        winner = "request_consultation";
        maxScore = consultationScore;
        reason = "Critical/Rare issue or treatment failure detected.";
    }
    else if (expertScore > maxScore && expertScore >= 3) {
        winner = "get_expert_advice";
        maxScore = expertScore;
        reason = "Repeated issue or moderate severity requires expert attention.";
    }
    else if (communityScore > maxScore && communityScore >= 2) {
        winner = "ask_community";
        maxScore = communityScore;
        reason = "Low confidence or ambiguity; community input valuable.";
    }
    return {
        recommendation: winner,
        score: maxScore,
        reason: reason
    };
};
exports.evaluateRecommendation = evaluateRecommendation;
