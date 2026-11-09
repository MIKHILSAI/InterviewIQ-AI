import {
  DashboardStats,
  SessionSummary,
  Question,
  InterviewReport,
  InterviewConfig,
  Badge,
  WeeklyGoal,
  CodingProblem,
  CodeReview,
  CodingReport,
} from './types';

export const mockCodingProblem: CodingProblem = {
  id: 'two-sum',
  title: 'Two Sum',
  statement: 'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. You may assume exactly one solution exists, and you may not use the same element twice.',
  topic: 'Arrays & Hashing',
  difficulty: 'beginner',
  constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Exactly one valid answer exists.'],
  examples: [
    { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9.' },
    { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]' },
  ],
  starterCode: {
    python: 'def two_sum(nums, target):\n    # Return the two matching indices.\n    pass\n',
    javascript: 'function twoSum(nums, target) {\n  // Return the two matching indices.\n}\n',
    java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Return the two matching indices.\n        return new int[]{};\n    }\n}\n',
  },
  hints: ['A brute-force approach checks every pair.', 'Can you store values you have already visited?', 'For each number, look for target minus that number.'],
};

export const mockCodingSolutions: Record<'python' | 'javascript' | 'java', string> = {
  python: 'def two_sum(nums, target):\n    seen = {}\n    for index, value in enumerate(nums):\n        complement = target - value\n        if complement in seen:\n            return [seen[complement], index]\n        seen[value] = index\n',
  javascript: 'function twoSum(nums, target) {\n  const seen = new Map();\n  for (let index = 0; index < nums.length; index += 1) {\n    const complement = target - nums[index];\n    if (seen.has(complement)) return [seen.get(complement), index];\n    seen.set(nums[index], index);\n  }\n}\n',
  java: 'import java.util.HashMap;\nimport java.util.Map;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int index = 0; index < nums.length; index++) {\n            int complement = target - nums[index];\n            if (seen.containsKey(complement)) return new int[]{seen.get(complement), index};\n            seen.put(nums[index], index);\n        }\n        return new int[]{};\n    }\n}\n',
};

export const mockCodeReview: CodeReview = {
  verdict: 'partially_correct',
  summary: 'The approach is on the right track, but it should return immediately after finding the complement.',
  issues: [{ severity: 'medium', line: 4, message: 'Return the indices as soon as the complement is found.' }],
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)',
  edgeCasesMissed: ['Negative values', 'Repeated values at different indices'],
  suggestedImprovement: 'Use a hash map from each seen value to its index for a single-pass solution.',
};

export const mockCodingReport: CodingReport = {
  problem: mockCodingProblem,
  language: 'python',
  finalCode: mockCodingSolutions.python,
  approachTranscript: 'I would scan once and keep a map from values to their indices. For each value, I would check whether target minus that value is already in the map.',
  review: mockCodeReview,
  scores: { problemUnderstanding: 86, approachAndAlgorithm: 82, codeCorrectness: 76, complexityAnalysis: 80, communication: 88 },
  overall: 82,
};

export const mockBadges: Badge[] = [
  { id: 'first_interview', name: 'First Steps', description: 'Complete your first eligible interview.', target: 1, current: 14, earned: true, earnedAt: '2026-10-28T10:00:00.000Z' },
  { id: 'five_interviews', name: 'Getting Comfortable', description: 'Complete five eligible interviews.', target: 5, current: 14, earned: true, earnedAt: '2026-11-02T10:00:00.000Z' },
  { id: 'ten_interviews', name: 'Interview Regular', description: 'Complete ten eligible interviews.', target: 10, current: 9, earned: false, earnedAt: null },
  { id: 'streak_3', name: 'Three-Day Streak', description: 'Practice on three consecutive days.', target: 3, current: 4, earned: true, earnedAt: '2026-11-08T10:00:00.000Z' },
  { id: 'streak_7', name: 'Week of Practice', description: 'Practice on seven consecutive days.', target: 7, current: 4, earned: false, earnedAt: null },
  { id: 'streak_30', name: 'Month of Momentum', description: 'Practice on thirty consecutive days.', target: 30, current: 4, earned: false, earnedAt: null },
  { id: 'score_80', name: 'Strong Performance', description: 'Score at least 80 in an eligible interview.', target: 80, current: 86, earned: true, earnedAt: '2026-11-09T10:00:00.000Z' },
  { id: 'score_90', name: 'Excellent Performance', description: 'Score at least 90 in an eligible interview.', target: 90, current: 86, earned: false, earnedAt: null },
  { id: 'all_rounder', name: 'All-Rounder', description: 'Complete both a technical and an HR interview.', target: 2, current: 1, earned: false, earnedAt: null },
  { id: 'multilingual', name: 'Multilingual', description: 'Complete interviews in two different languages.', target: 2, current: 1, earned: false, earnedAt: null },
  { id: 'comeback', name: 'Comeback', description: 'Improve by at least 15 points in the same domain.', target: 15, current: 8, earned: false, earnedAt: null },
  { id: 'goal_getter', name: 'Goal Getter', description: 'Achieve your weekly interview target.', target: 1, current: 0, earned: false, earnedAt: null },
];

export const mockWeeklyGoal: WeeklyGoal = {
  targetInterviews: 3,
  completedInterviews: 2,
  weekStart: '2026-11-09',
  weekEnd: '2026-11-15',
  daysActive: [true, false, true, false, false, false, false],
  achieved: false,
  streakWeeks: 0,
};

export const mockStats: DashboardStats = {
  totalInterviews: 14,
  avgScore: 78,
  bestScore: 92,
  practiceMinutes: 148,
  streakDays: 4,
  trend: [
    { date: '01 Nov', score: 62 },
    { date: '03 Nov', score: 68 },
    { date: '04 Nov', score: 71 },
    { date: '05 Nov', score: 74 },
    { date: '06 Nov', score: 80 },
    { date: '07 Nov', score: 83 },
    { date: '08 Nov', score: 89 },
    { date: '09 Nov', score: 86 },
  ],
  weakTopics: [
    { topic: 'System Design & Scalability', score: 54 },
    { topic: 'Concurrency & Locking', score: 61 },
    { topic: 'SQL Query Optimization', score: 68 },
    { topic: 'Behavioral: Conflict Resolution', score: 72 },
  ],
};

export const mockSessions: SessionSummary[] = [
  {
    sessionId: 'sess_py_01',
    config: {
      type: 'technical',
      domain: 'Python',
      difficulty: 'intermediate',
      durationMin: 10,
      language: 'en',
    },
    startedAt: '2026-11-09T07:15:00.000Z',
    status: 'completed',
    overallScore: 86,
    durationSec: 542,
  },
  {
    sessionId: 'sess_os_02',
    config: {
      type: 'technical',
      domain: 'Operating Systems',
      difficulty: 'intermediate',
      durationMin: 10,
      language: 'en',
    },
    startedAt: '2026-11-08T14:30:00.000Z',
    status: 'completed',
    overallScore: 78,
    durationSec: 580,
  },
  {
    sessionId: 'sess_sql_03',
    config: {
      type: 'technical',
      domain: 'SQL',
      difficulty: 'beginner',
      durationMin: 5,
      language: 'en',
    },
    startedAt: '2026-11-07T09:20:00.000Z',
    status: 'completed',
    overallScore: 91,
    durationSec: 295,
  },
  {
    sessionId: 'sess_hr_04',
    config: {
      type: 'hr',
      domain: 'Behavioural',
      difficulty: 'intermediate',
      durationMin: 10,
      language: 'en',
    },
    startedAt: '2026-11-05T16:45:00.000Z',
    status: 'completed',
    overallScore: 74,
    durationSec: 510,
  },
  {
    sessionId: 'sess_ta_05',
    config: {
      type: 'technical',
      domain: 'Data Structures & Algorithms',
      difficulty: 'intermediate',
      durationMin: 10,
      language: 'ta',
    },
    startedAt: '2026-11-04T11:00:00.000Z',
    status: 'completed',
    overallScore: 82,
    durationSec: 560,
  },
  {
    sessionId: 'sess_live_06',
    config: {
      type: 'mixed',
      domain: 'OOP',
      difficulty: 'advanced',
      durationMin: 15,
      language: 'en',
    },
    startedAt: '2026-11-09T08:10:00.000Z',
    status: 'in_progress',
    overallScore: null,
    durationSec: 180,
  },
];

export const mockQuestionPool: Record<string, Question[]> = {
  Python: [
    {
      id: 'q_py_1',
      index: 0,
      topic: 'Python Memory Management',
      text: 'Can you explain how memory management and garbage collection work in Python, specifically regarding reference counting and cyclical references?',
      isFollowUp: false,
      audioUrl: null,
    },
    {
      id: 'q_py_2',
      index: 1,
      topic: 'Python Concurrency',
      text: 'You mentioned the Global Interpreter Lock (GIL). What exact problem does the GIL solve, and how does it impact multi-threaded CPU-bound programs?',
      isFollowUp: true,
      audioUrl: null,
    },
    {
      id: 'q_py_3',
      index: 2,
      topic: 'Generators & Iterators',
      text: 'What is the practical difference between a regular function returning a list and a generator using yield? When would you strictly choose one over the other?',
      isFollowUp: false,
      audioUrl: null,
    },
    {
      id: 'q_py_4',
      index: 3,
      topic: 'Decorators & Closures',
      text: 'Follow up on closures: how does Python preserve the enclosed state when a decorator returns a wrapper function, and why do we use functools.wraps?',
      isFollowUp: true,
      audioUrl: null,
    },
    {
      id: 'q_py_5',
      index: 4,
      topic: 'Data Structures Internals',
      text: 'How does Python implement dictionaries under the hood since Python 3.6/3.7 to guarantee both O(1) amortized lookup and insertion ordering?',
      isFollowUp: false,
      audioUrl: null,
    },
  ],
  'Operating Systems': [
    {
      id: 'q_os_1',
      index: 0,
      topic: 'Processes vs Threads',
      text: 'Can you explain the key architectural differences between a process and a thread, especially regarding memory space and context switching overhead?',
      isFollowUp: false,
      audioUrl: null,
    },
    {
      id: 'q_os_2',
      index: 1,
      topic: 'Concurrency & Deadlocks',
      text: 'You mentioned shared memory and synchronization. What are the four Coffman conditions required for a deadlock to occur, and how can we prevent at least one?',
      isFollowUp: true,
      audioUrl: null,
    },
    {
      id: 'q_os_3',
      index: 2,
      topic: 'Virtual Memory & Paging',
      text: 'How does virtual memory translation work using page tables and the Translation Lookaside Buffer (TLB)? What triggers a page fault?',
      isFollowUp: false,
      audioUrl: null,
    },
    {
      id: 'q_os_4',
      index: 3,
      topic: 'Thrashing',
      text: 'What is thrashing in the context of virtual memory, and what operational steps does the OS scheduler take when thrashing is detected?',
      isFollowUp: true,
      audioUrl: null,
    },
  ],
  SQL: [
    {
      id: 'q_sql_1',
      index: 0,
      topic: 'Indexing & B-Trees',
      text: 'How do B-tree indexes speed up SQL SELECT queries, and what is the trade-off when performing high-frequency INSERT or UPDATE operations?',
      isFollowUp: false,
      audioUrl: null,
    },
    {
      id: 'q_sql_2',
      index: 1,
      topic: 'Clustered Indexes',
      text: 'Can a table have multiple clustered indexes? Explain why or why not and how leaf nodes differ between clustered and non-clustered indexes.',
      isFollowUp: true,
      audioUrl: null,
    },
    {
      id: 'q_sql_3',
      index: 2,
      topic: 'ACID Properties & Isolation',
      text: 'Walk me through the ACID properties, and specifically contrast Read Committed isolation with Repeatable Read using a phantom read example.',
      isFollowUp: false,
      audioUrl: null,
    },
  ],
  Behavioural: [
    {
      id: 'q_hr_1',
      index: 0,
      topic: 'Conflict Resolution',
      text: 'Describe a situation where you had a strong disagreement with a peer or team member over a technical decision. How did you handle it and what was the outcome?',
      isFollowUp: false,
      audioUrl: null,
    },
    {
      id: 'q_hr_2',
      index: 1,
      topic: 'Ownership & Accountability',
      text: 'Follow-up: Looking back on that conflict, is there anything you would communicate differently today to achieve consensus faster?',
      isFollowUp: true,
      audioUrl: null,
    },
    {
      id: 'q_hr_3',
      index: 2,
      topic: 'Deadline Pressure',
      text: 'Tell me about a time when you realized a project was slipping behind schedule. How did you prioritize deliverables and reset expectations?',
      isFollowUp: false,
      audioUrl: null,
    },
  ],
  default: [
    {
      id: 'q_def_1',
      index: 0,
      topic: 'Fundamental Architecture',
      text: 'Could you give an architectural overview of your preferred development stack and how data flows from user input to persistent storage?',
      isFollowUp: false,
      audioUrl: null,
    },
    {
      id: 'q_def_2',
      index: 1,
      topic: 'Error Handling & Resilience',
      text: 'In that architecture, how do you handle partial network failures or degraded backend dependencies gracefully?',
      isFollowUp: true,
      audioUrl: null,
    },
    {
      id: 'q_def_3',
      index: 2,
      topic: 'Performance Optimization',
      text: 'What metrics do you monitor to identify performance bottlenecks, and what profiling tools do you rely on?',
      isFollowUp: false,
      audioUrl: null,
    },
  ],
};

export function getMockQuestionsForDomain(domain: string): Question[] {
  return mockQuestionPool[domain] || mockQuestionPool['default'];
}

export function mockReport(sessionId: string): InterviewReport {
  const existing = mockSessions.find((s) => s.sessionId === sessionId);
  const config: InterviewConfig = existing
    ? existing.config
    : {
        type: 'technical',
        domain: 'Python',
        difficulty: 'intermediate',
        durationMin: 10,
        language: 'en',
      };

  return {
    sessionId,
    config,
    startedAt: '2026-11-09T07:15:00.000Z',
    completedAt: '2026-11-09T07:24:02.000Z',
    durationSec: 542,
    overallScore: 84,
    scores: {
      technicalCorrectness: 88,
      conceptualUnderstanding: 85,
      completeness: 80,
      relevance: 90,
      communicationClarity: 78,
    },
    topicScores: [
      { topic: 'Memory & Garbage Collection', score: 90 },
      { topic: 'GIL & Concurrency', score: 85 },
      { topic: 'Generators & Iteration', score: 92 },
      { topic: 'Closures & Decorators', score: 76 },
      { topic: 'Dictionary Internal Architecture', score: 78 },
    ],
    strengths: [
      'Strong, accurate articulation of reference counting vs generational garbage collection.',
      'Clear, precise explanation of why the GIL is necessary for thread-safe CPython memory structures.',
      'Excellent real-world examples distinguishing list comprehension memory spikes from generator streaming.',
      'Clear professional tone and structured answers using cause-and-effect reasoning.',
    ],
    weaknesses: [
      'Briefly hesitated on explaining cyclic reference detection (gc module threshold generation counters).',
      'Could provide more concrete production examples when discussing thread pools vs multiprocessing.',
      'Slight filler words ("um", "like") during initial thinking before answering decorator internals.',
    ],
    results: [
      {
        question: {
          id: 'q_py_1',
          index: 0,
          topic: 'Memory Management',
          text: 'Can you explain how memory management and garbage collection work in Python, specifically regarding reference counting and cyclical references?',
          isFollowUp: false,
          audioUrl: null,
        },
        transcript:
          'In Python, primary memory management is performed through reference counting. Every object has an ob_refcnt header. When the reference count drops to zero, the memory is deallocated immediately. However, reference counting alone cannot resolve circular references, such as two objects pointing to each other. For this, Python has a cyclic garbage collector using three generations—Gen 0, 1, and 2—which runs heuristic collection passes to detect unreferenced cycles.',
        evaluation: {
          overall: 90,
          scores: {
            technicalCorrectness: 92,
            conceptualUnderstanding: 90,
            completeness: 88,
            relevance: 95,
            communicationClarity: 85,
          },
          strengths: [
            'Directly differentiated reference counting from cyclic GC.',
            'Correctly identified generation levels 0, 1, and 2.',
          ],
          improvements: [
            'Mention the PyObject struct and tp_traverse pointer mechanism for full technical completeness.',
          ],
          missingConcepts: ['PyObject structure', 'gc.collect() manual triggers'],
          modelAnswer:
            'Python manages memory through a dual-layered system: reference counting and a generational cyclic garbage collector. Reference counting handles immediate deallocation when references reach zero. For cyclic references where objects point to each other without external references, Python maintains a linked list of container objects and tracks their reference counts independently using three generational pools based on survival age.',
        },
      },
      {
        question: {
          id: 'q_py_2',
          index: 1,
          topic: 'GIL & Concurrency',
          text: 'You mentioned the Global Interpreter Lock (GIL). What exact problem does the GIL solve, and how does it impact multi-threaded CPU-bound programs?',
          isFollowUp: true,
          audioUrl: null,
        },
        transcript:
          'The GIL is a mutex that prevents multiple native threads from executing Python bytecodes simultaneously. It exists because CPython memory management is not thread-safe—the reference count headers could suffer race conditions without locking. For CPU-bound tasks, multi-threading in Python actually causes slow downs due to context switching and lock contention. For CPU bound parallelism, we use the multiprocessing module or subinterpreters.',
        evaluation: {
          overall: 88,
          scores: {
            technicalCorrectness: 90,
            conceptualUnderstanding: 88,
            completeness: 85,
            relevance: 92,
            communicationClarity: 85,
          },
          strengths: [
            'Accurately linked GIL rationale directly to thread-unsafe reference counting.',
            'Prescribed multiprocessing as the practical solution for CPU-bound tasks.',
          ],
          improvements: [
            'Could contrast with I/O-bound tasks where threading or asyncio provides true throughput improvements.',
          ],
          missingConcepts: ['I/O bound thread release', 'PEP 703 free-threaded Python'],
          modelAnswer:
            'The Global Interpreter Lock is a mutual-exclusion lock protecting access to Python objects, preventing multiple threads from corrupting memory while modifying reference counts. In CPU-bound workloads, threads compete for the lock without gaining parallel computation, adding OS context-switching overhead. For IO-bound tasks, the GIL is released during system calls, making threading viable.',
        },
      },
      {
        question: {
          id: 'q_py_3',
          index: 2,
          topic: 'Generators & Iteration',
          text: 'What is the practical difference between a regular function returning a list and a generator using yield? When would you strictly choose one over the other?',
          isFollowUp: false,
          audioUrl: null,
        },
        transcript:
          'A standard function constructs the complete result in memory before returning, requiring O(N) space. A generator yields values lazily on demand when next() is called, maintaining internal execution frame state with O(1) auxiliary space. I strictly choose generators when streaming massive datasets like gigabyte log files or infinite sequences, and standard lists when random indexing or multiple passes over the collection are required.',
        evaluation: {
          overall: 92,
          scores: {
            technicalCorrectness: 95,
            conceptualUnderstanding: 92,
            completeness: 90,
            relevance: 95,
            communicationClarity: 88,
          },
          strengths: [
            'Clear computational complexity analysis comparing O(N) vs O(1) space.',
            'Solid decision matrix: log file streaming vs multiple-pass indexed access.',
          ],
          improvements: [
            'Briefly mention memory profiling tools or itertools generators.',
          ],
          missingConcepts: ['Generator exhaustion protocol', 'itertools chaining'],
          modelAnswer:
            'Standard functions evaluate greedily and allocate all return elements in heap memory, returning an iterable list. Generators evaluate lazily using the yield keyword, returning a generator iterator that computes values one by one on each invocation of __next__(). Use generators when data size exceeds memory or streaming pipelines are desired; use lists when items must be sliced, sorted, or iterated repeatedly.',
        },
      },
      {
        question: {
          id: 'q_py_4',
          index: 3,
          topic: 'Closures & Decorators',
          text: 'Follow up on closures: how does Python preserve the enclosed state when a decorator returns a wrapper function, and why do we use functools.wraps?',
          isFollowUp: true,
          audioUrl: null,
        },
        transcript:
          'A closure binds a nested function to variables in its enclosing scope through the __closure__ attribute containing cell objects. When you create a decorator, the inner wrapper function references these cells. We use functools.wraps on the wrapper function to copy the original functions metadata like __name__, __doc__, and type annotations so debugging, introspection, and docstrings do not get masked by wrapper.',
        evaluation: {
          overall: 82,
          scores: {
            technicalCorrectness: 84,
            conceptualUnderstanding: 80,
            completeness: 80,
            relevance: 88,
            communicationClarity: 78,
          },
          strengths: [
            'Specifically called out cell objects and the __closure__ tuple.',
            'Understood metadata preservation with functools.wraps.',
          ],
          improvements: [
            'Explain how *args and **kwargs unpacking guarantees general decorator flexibility.',
          ],
          missingConcepts: ['functools.update_wrapper', 'closure cell scope rebinding'],
          modelAnswer:
            'Python implements closures by capturing non-local free variables in cell objects stored inside the wrapper functions __closure__ tuple. This keeps values in memory even after the outer decorator function has finished executing. We apply @functools.wraps(fn) to preserve the decorated functions identity, including its __name__, __qualname__, docstring, and signature for tools like Sphinx, IDEs, and inspect.',
        },
      },
      {
        question: {
          id: 'q_py_5',
          index: 4,
          topic: 'Dictionary Internals',
          text: 'How does Python implement dictionaries under the hood since Python 3.6/3.7 to guarantee both O(1) amortized lookup and insertion ordering?',
          isFollowUp: false,
          audioUrl: null,
        },
        transcript:
          'Python split dictionaries into a sparse index array and a dense entries table. The dense table stores entries in the exact order they were inserted with hash, key, and value. The hash index table contains indices pointing into the dense table. This compact layout saves about twenty to twenty-five percent memory and naturally maintains insertion order.',
        evaluation: {
          overall: 80,
          scores: {
            technicalCorrectness: 82,
            conceptualUnderstanding: 80,
            completeness: 78,
            relevance: 84,
            communicationClarity: 76,
          },
          strengths: [
            'Accurately described the split between the sparse indices array and dense entries array.',
            'Correctly identified memory savings and how insertion order is preserved.',
          ],
          improvements: [
            'Detail open addressing and the perturbation shift algorithm used for collision resolution.',
          ],
          missingConcepts: ['Perturbation collision formula', 'Resize threshold load factor'],
          modelAnswer:
            'Since Python 3.6, dicts use Raymond Hettingers compact layout: a sparse hash index array and a compact array of [hash, key, value] tuples. Keys are appended to the dense array in sequential insertion order. When looking up a key, its hash is mapped modulo the sparse array size to retrieve the dense index. Collisions are handled via pseudo-random perturbation probing, preserving O(1) amortized lookup while minimizing wasted bucket space.',
        },
      },
    ],
    studyPlan: [
        {
          topic: 'Low-Level CPython Internals & Cell Rebinding',
          reason: 'Deepen understanding of PyCellObject and bytecode operations to answer senior-level Python architecture questions with authority.',
          suggestedQuestions: [
            'How does dis.disassemble show LOAD_DEREF vs LOAD_FAST?',
            'What happens when you modify a nonlocal variable inside a nested closure?',
            'How does Python 3.13 free-threaded mode (PEP 703) remove the GIL?',
          ],
        },
        {
          topic: 'Hash Table Collision Probing & Load Factors',
          reason: 'Solidify hash table perturbation logic and memory resizing mechanics for system design and core algorithmic discussions.',
          suggestedQuestions: [
            'What is the formula used in Python dict perturbation probing?',
            'At what load factor does a Python dictionary resize, and by what factor?',
            'Why are dict keys required to implement both __hash__ and __eq__?',
          ],
        },
        {
          topic: 'Communication Precision & Filler Reduction',
          reason: 'Pacing the initial 3 seconds of each response with structured frameworks (Definition → Mechanism → Tradeoff) will elevate your communication score from 78 to 90+.',
          suggestedQuestions: [
            'Practice answering in 3 parts: Concept summary, Underlying mechanism, Production trade-off.',
            'Record a 60-second explanation of asyncio event loops without filler pauses.',
            'Explain a technical trade-off using the STAR method format.',
          ],
        },
      ],
      summaryFeedback:
        'Excellent overall interview performance! Your technical foundation in Python runtime mechanics, memory management, and generator pipelines is remarkably strong. You communicated core architectural principles with clarity and confidence. To reach the top percentile, review low-level collision resolution algorithms and eliminate brief filler pauses before complex answers.',
      summaryAudioUrl: null,
    coding: config.type === 'coding' ? {
      ...mockCodingReport,
      language: config.codingLanguage || 'python',
      finalCode: mockCodingProblem.starterCode[config.codingLanguage || 'python'],
    } : undefined,
  };
}
