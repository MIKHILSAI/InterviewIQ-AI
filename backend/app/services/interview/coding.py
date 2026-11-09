"""Coding-round problem bank and safe static-review helpers."""

from app.schemas import CodingProblem, Difficulty


_STARTERS = {
    "two_sum": {
        "python": "def two_sum(nums: list[int], target: int) -> list[int]:\n    pass\n",
        "javascript": "function twoSum(nums, target) {\n  // Return the two distinct indices.\n}\n",
        "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[0];\n    }\n}\n",
    },
    "valid_parentheses": {
        "python": "def is_valid(text: str) -> bool:\n    pass\n",
        "javascript": "function isValid(text) {\n  // Return whether every bracket is balanced.\n}\n",
        "java": "class Solution {\n    public boolean isValid(String text) {\n        return false;\n    }\n}\n",
    },
    "binary_search": {
        "python": "def binary_search(values: list[int], target: int) -> int:\n    pass\n",
        "javascript": "function binarySearch(values, target) {\n  // Return the matching index, or -1.\n}\n",
        "java": "class Solution {\n    public int binarySearch(int[] values, int target) {\n        return -1;\n    }\n}\n",
    },
    "merge_intervals": {
        "python": "def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:\n    pass\n",
        "javascript": "function mergeIntervals(intervals) {\n  // Return sorted, non-overlapping intervals.\n}\n",
        "java": "class Solution {\n    public int[][] merge(int[][] intervals) {\n        return new int[0][0];\n    }\n}\n",
    },
    "longest_unique_substring": {
        "python": "def longest_unique_substring(text: str) -> int:\n    pass\n",
        "javascript": "function longestUniqueSubstring(text) {\n  // Return the maximum substring length.\n}\n",
        "java": "class Solution {\n    public int lengthOfLongestSubstring(String text) {\n        return 0;\n    }\n}\n",
    },
    "first_unique_character": {
        "python": "def first_unique_character(text: str) -> int:\n    pass\n",
        "javascript": "function firstUniqueCharacter(text) {\n  // Return the first unique character's index, or -1.\n}\n",
        "java": "class Solution {\n    public int firstUniqChar(String text) {\n        return -1;\n    }\n}\n",
    },
}

_PROBLEMS = [
    {
        "key": "two_sum",
        "title": "Pair With Target Sum",
        "difficulty": "beginner",
        "description": "Given an integer array and a target, return the indices of two distinct elements whose values sum to the target. Exactly one pair exists; do not reuse an index.",
        "input_format": "An integer array nums and integer target.",
        "output_format": "A pair of distinct zero-based indices.",
        "examples": ["nums=[2, 7, 11, 15], target=9 → [0, 1]", "nums=[3, 2, 4], target=6 → [1, 2]"],
        "constraints": ["2 <= nums.length <= 100000", "Values and target fit a signed 32-bit integer."],
        "hints": ["Try checking each pair of indices.", "Store values you have already visited.", "For each value, look for target minus that value."],
    },
    {
        "key": "valid_parentheses",
        "title": "Balanced Brackets",
        "difficulty": "beginner",
        "description": "Given a string containing only (), {}, and [], determine whether every opening bracket is closed by the correct type in the correct order.",
        "input_format": "A string containing bracket characters.",
        "output_format": "True if the brackets are balanced, otherwise false.",
        "examples": ["text=\"([])\" → true", "text=\"([)]\" → false"],
        "constraints": ["0 <= text.length <= 100000"],
        "hints": ["The order of closing brackets matters.", "Keep track of the most recent unmatched opening bracket.", "A stack can help match each closing bracket to its opening type."],
    },
    {
        "key": "binary_search",
        "title": "Search a Sorted Array",
        "difficulty": "beginner",
        "description": "Given a sorted ascending array of distinct integers and a target, return its index or -1 if it is absent. Aim for logarithmic time.",
        "input_format": "A sorted integer array values and integer target.",
        "output_format": "The target index, or -1.",
        "examples": ["values=[-3, 0, 4, 9], target=4 → 2", "values=[1, 5, 8], target=2 → -1"],
        "constraints": ["0 <= values.length <= 100000", "Values are distinct and sorted ascending."],
        "hints": ["Use the sorted order to eliminate part of the search space.", "Compare the middle value with the target.", "Move one boundary each iteration until found or the range is empty."],
    },
    {
        "key": "merge_intervals",
        "title": "Merge Overlapping Intervals",
        "difficulty": "intermediate",
        "description": "Given intervals [start, end], merge all overlapping intervals and return the remaining intervals sorted by start.",
        "input_format": "A list of integer endpoint pairs.",
        "output_format": "A list of sorted, pairwise non-overlapping endpoint pairs.",
        "examples": ["[[1,3],[2,6],[8,10]] → [[1,6],[8,10]]", "[[1,4],[4,5]] → [[1,5]]"],
        "constraints": ["0 <= intervals.length <= 10000", "start <= end for every interval."],
        "hints": ["Sort intervals by their start value first.", "Compare each interval with the last merged interval.", "Extend the current end when the ranges overlap."],
    },
    {
        "key": "longest_unique_substring",
        "title": "Longest Unique-Character Window",
        "difficulty": "intermediate",
        "description": "Return the length of the longest contiguous substring that contains no repeated characters.",
        "input_format": "A string text.",
        "output_format": "A non-negative integer length.",
        "examples": ["text=\"abcabcbb\" → 3", "text=\"bbbbb\" → 1"],
        "constraints": ["0 <= text.length <= 100000", "The input contains ordinary Unicode text."],
        "hints": ["Track a window whose characters are all unique.", "Move the left edge when a repeated character appears.", "A map of last-seen indices can update the window efficiently."],
    },
    {
        "key": "first_unique_character",
        "title": "First Unique Character",
        "difficulty": "beginner",
        "description": "Return the index of the first character that occurs exactly once in the string, or -1 if no such character exists.",
        "input_format": "A string text.",
        "output_format": "A zero-based character index, or -1.",
        "examples": ["text=\"leetcode\" → 0", "text=\"aabb\" → -1"],
        "constraints": ["0 <= text.length <= 100000", "Character comparison is case-sensitive."],
        "hints": ["You need the total count for each character.", "A first pass can build character frequencies.", "A second pass can find the first character with count one."],
    },
]


def fallback_problem(difficulty: Difficulty, problem_id: str) -> CodingProblem:
    """Returns a validated curated problem when generation is unavailable."""
    candidates = [problem for problem in _PROBLEMS if problem["difficulty"] == difficulty]
    chosen = candidates[0] if candidates else _PROBLEMS[0]
    return CodingProblem(
        id=problem_id,
        title=chosen["title"],
        description=chosen["description"],
        difficulty=chosen["difficulty"],
        input_format=chosen["input_format"],
        output_format=chosen["output_format"],
        examples=chosen["examples"],
        constraints=chosen["constraints"],
        starter_code=_STARTERS[chosen["key"]],
        hints=chosen["hints"],
    )


def problem_bank_size() -> int:
    """Expose the curated fallback count for contract tests."""
    return len(_PROBLEMS)
