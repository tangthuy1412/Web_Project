import { create } from 'zustand'
import type { Repository, AnalysisResult } from '../types'
import { mockRepositories, mockAnalysisResults } from '../mock/data'

interface RepositoryState {
  repositories: Repository[]
  analyses: AnalysisResult[]
  selectedRepository: Repository | null
  isLoading: boolean
  fetchRepositories: () => Promise<void>
  analyzeRepository: (id: string) => Promise<void>
  getAnalysisById: (id: string) => AnalysisResult | undefined
  setSelectedRepository: (repo: Repository | null) => void
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repositories: mockRepositories,
  analyses: mockAnalysisResults,
  selectedRepository: null,
  isLoading: false,

  fetchRepositories: async () => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 1000))
    set({ repositories: mockRepositories, isLoading: false })
  },

  analyzeRepository: async (id: string) => {
    set({ isLoading: true })
    await new Promise(resolve => setTimeout(resolve, 2000))

    const newAnalysis: AnalysisResult = {
      id: `analysis-${Date.now()}`,
      repositoryId: id,
      repositoryName: get().repositories.find(r => r.id === id)?.name || '',
      createdAt: new Date().toISOString(),
      projectType: 'Web Application',
      techStack: ['React', 'TypeScript'],
      scores: {
        architecture: 75,
        completeness: 70,
        commitQuality: 72,
        documentation: 68,
        codeConvention: 80,
        overall: 73
      },
      strengths: ['Good code structure', 'Clean commits'],
      weaknesses: ['Missing tests', 'Incomplete documentation'],
      recommendations: [],
      missingSkills: [],
      careerDirection: {
        primary: 'Frontend Developer',
        secondary: ['Full-Stack Engineer'],
        confidence: 75,
        reasoning: 'Based on current skill set and project type'
      },
      portfolioReadiness: {
        overallReadiness: 65,
        items: []
      }
    }

    set(state => ({
      analyses: [...state.analyses, newAnalysis],
      repositories: state.repositories.map(r =>
        r.id === id ? { ...r, analyzed: true, analysisId: newAnalysis.id } : r
      ),
      isLoading: false
    }))
  },

  getAnalysisById: (id: string) => {
    return get().analyses.find(a => a.id === id)
  },

  setSelectedRepository: (repo: Repository | null) => {
    set({ selectedRepository: repo })
  }
}))
