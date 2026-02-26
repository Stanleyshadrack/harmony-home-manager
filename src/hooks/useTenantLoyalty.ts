import { TenantLoyaltyScore, LoyaltyHistoryEntry, LoyaltyFactors, getTierFromScore } from '@/types/tenantLoyalty';
import { useState, useEffect, useCallback } from 'react';


const STORAGE_KEY = 'tenant_loyalty_scores';
const HISTORY_KEY = 'tenant_loyalty_history';

// Mock initial data
const generateMockScores = (): TenantLoyaltyScore[] => [
  {
    tenantId: '1',
    tier: 'gold',
    score: 78,
    factors: {
      paymentHistory: 35,
      tenureMonths: 15,
      maintenanceResponsibility: 12,
      communicationScore: 10,
      requestReasonability: 6,
    },
    updatedAt: new Date().toISOString(),
  },
  {
    tenantId: '2',
    tier: 'platinum',
    score: 92,
    factors: {
      paymentHistory: 40,
      tenureMonths: 18,
      maintenanceResponsibility: 14,
      communicationScore: 12,
      requestReasonability: 8,
    },
    updatedAt: new Date().toISOString(),
  },
  {
    tenantId: '3',
    tier: 'new',
    score: 35,
    factors: {
      paymentHistory: 15,
      tenureMonths: 5,
      maintenanceResponsibility: 8,
      communicationScore: 5,
      requestReasonability: 2,
    },
    updatedAt: new Date().toISOString(),
  },
];

const getStoredScores = (): TenantLoyaltyScore[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : generateMockScores();
  } catch {
    return generateMockScores();
  }
};

const saveScores = (scores: TenantLoyaltyScore[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
};

const getStoredHistory = (): LoyaltyHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveHistory = (history: LoyaltyHistoryEntry[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export function useTenantLoyalty() {
  const [scores, setScores] = useState<TenantLoyaltyScore[]>([]);
  const [history, setHistory] = useState<LoyaltyHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setScores(getStoredScores());
    setHistory(getStoredHistory());
    setIsLoading(false);
  }, []);

  const getTenantScore = useCallback(
    (tenantId: string): TenantLoyaltyScore | undefined => {
      return scores.find((s) => s.tenantId === tenantId);
    },
    [scores]
  );

  const getTenantHistory = useCallback(
    (tenantId: string): LoyaltyHistoryEntry[] => {
      return history.filter((h) => h.tenantId === tenantId);
    },
    [history]
  );

  const updateScore = useCallback(
    (tenantId: string, factors: Partial<LoyaltyFactors>) => {
      const existingScore = scores.find((s) => s.tenantId === tenantId);
      const newFactors: LoyaltyFactors = {
        paymentHistory: factors.paymentHistory ?? existingScore?.factors.paymentHistory ?? 0,
        tenureMonths: factors.tenureMonths ?? existingScore?.factors.tenureMonths ?? 0,
        maintenanceResponsibility: factors.maintenanceResponsibility ?? existingScore?.factors.maintenanceResponsibility ?? 0,
        communicationScore: factors.communicationScore ?? existingScore?.factors.communicationScore ?? 0,
        requestReasonability: factors.requestReasonability ?? existingScore?.factors.requestReasonability ?? 0,
      };

      const totalScore = Object.values(newFactors).reduce((sum, val) => sum + val, 0);
      const tier = getTierFromScore(totalScore);

      const newScore: TenantLoyaltyScore = {
        tenantId,
        tier,
        score: totalScore,
        factors: newFactors,
        updatedAt: new Date().toISOString(),
      };

      const updated = existingScore
        ? scores.map((s) => (s.tenantId === tenantId ? newScore : s))
        : [...scores, newScore];

      setScores(updated);
      saveScores(updated);
      return newScore;
    },
    [scores]
  );

  const addLoyaltyEvent = useCallback(
    (
      tenantId: string,
      action: LoyaltyHistoryEntry['action'],
      pointsChange: number,
      description: string
    ) => {
      const entry: LoyaltyHistoryEntry = {
        id: `lh-${Date.now()}`,
        tenantId,
        action,
        pointsChange,
        description,
        createdAt: new Date().toISOString(),
      };

      const newHistory = [entry, ...history];
      setHistory(newHistory);
      saveHistory(newHistory);

      // Update the score based on the action type
      const existingScore = scores.find((s) => s.tenantId === tenantId);
      if (existingScore) {
        const factors = { ...existingScore.factors };
        
        if (action === 'payment_on_time') {
          factors.paymentHistory = Math.min(40, factors.paymentHistory + 2);
        } else if (action === 'payment_late') {
          factors.paymentHistory = Math.max(0, factors.paymentHistory - 5);
        } else if (action === 'request_approved') {
          factors.requestReasonability = Math.min(10, factors.requestReasonability + 1);
        } else if (action === 'request_denied') {
          factors.requestReasonability = Math.max(0, factors.requestReasonability - 1);
        } else if (action === 'positive_feedback') {
          factors.communicationScore = Math.min(15, factors.communicationScore + 2);
        } else if (action === 'negative_feedback') {
          factors.communicationScore = Math.max(0, factors.communicationScore - 3);
        } else if (action === 'lease_renewal') {
          factors.tenureMonths = Math.min(20, factors.tenureMonths + 3);
        }

        updateScore(tenantId, factors);
      }

      return entry;
    },
    [history, scores, updateScore]
  );

  const initializeTenantScore = useCallback(
    (tenantId: string): TenantLoyaltyScore => {
      const initialFactors: LoyaltyFactors = {
        paymentHistory: 10,
        tenureMonths: 0,
        maintenanceResponsibility: 5,
        communicationScore: 5,
        requestReasonability: 5,
      };
      return updateScore(tenantId, initialFactors);
    },
    [updateScore]
  );

  const getRecommendation = useCallback(
    (tenantId: string): { shouldPrioritize: boolean; reason: string } => {
      const score = getTenantScore(tenantId);
      if (!score) {
        return { shouldPrioritize: false, reason: 'No loyalty data available' };
      }

      if (score.tier === 'platinum') {
        return { shouldPrioritize: true, reason: 'Platinum tenant - highest priority' };
      }
      if (score.tier === 'gold') {
        return { shouldPrioritize: true, reason: 'Gold tenant - high priority' };
      }
      if (score.tier === 'silver') {
        return { shouldPrioritize: false, reason: 'Silver tenant - standard priority' };
      }
      return { shouldPrioritize: false, reason: 'Standard priority' };
    },
    [getTenantScore]
  );

  const getTopTenants = useCallback(
    (limit: number = 5): TenantLoyaltyScore[] => {
      return [...scores].sort((a, b) => b.score - a.score).slice(0, limit);
    },
    [scores]
  );

  return {
    scores,
    history,
    isLoading,
    getTenantScore,
    getTenantHistory,
    updateScore,
    addLoyaltyEvent,
    initializeTenantScore,
    getRecommendation,
    getTopTenants,
  };
}
