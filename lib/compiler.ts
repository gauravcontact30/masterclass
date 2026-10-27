/*
 * The online Java and C++ compiler (app/(learning)/learning/compiler, lib/server/compiler.ts). Client-safe: the
 * languages, their standards, starter programs and the hand-off that "Open in compiler" buttons use.
 */

export type CompilerLanguage = "java" | "cpp";
export type CompilerFile = { name: string; code: string };
export type CompilerRequest = { language: CompilerLanguage; standard: string; files: CompilerFile[]; stdin: string };
export type CompilerResult = {
  phase: "compile" | "run";
  ok: boolean;
  compileOutput: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  durationMs: number;
  toolchain: string;
};

export const CPP_STANDARDS = ["c++26", "c++23", "c++20", "c++17", "c++14", "c++11"] as const;
export const JAVA_RELEASES = ["25", "21", "17", "11"] as const;

export const COMPILER_LIMITS = { files: 8, fileBytes: 64_000, totalBytes: 200_000, stdinBytes: 64_000, runSeconds: 10, compileSeconds: 30 } as const;

export const STARTERS: Record<CompilerLanguage, CompilerFile[]> = {
  java: [{
    name: "Main.java",
    code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String name = in.hasNextLine() ? in.nextLine() : "World";
        List<Integer> squares = new ArrayList<>();
        for (int i = 1; i <= 5; i++) squares.add(i * i);
        System.out.println("Hello, " + name + "!");
        System.out.println("Squares: " + squares);
        System.out.println("Java " + Runtime.version().feature());
    }
}
`,
  }],
  cpp: [{
    name: "main.cpp",
    code: `#include <iostream>
#include <string>
#include <vector>
#include <numeric>

int main() {
    std::string name;
    if (!std::getline(std::cin, name) || name.empty()) name = "World";
    std::vector<int> squares;
    for (int i = 1; i <= 5; ++i) squares.push_back(i * i);
    std::cout << "Hello, " << name << "!\\n";
    std::cout << "Sum of squares: " << std::accumulate(squares.begin(), squares.end(), 0) << "\\n";
    std::cout << "C++ standard: " << __cplusplus << "\\n";
}
`,
  }],
};

/** "Open in compiler" from a course example: the files ride in localStorage to /learning/compiler. */
export const COMPILER_HANDOFF_KEY = "mcb:compiler:handoff";
export const languageOfFile = (name: string): CompilerLanguage | null => /\.java$/i.test(name) ? "java" : /\.(cpp|cc|cxx|hpp|h)$/i.test(name) ? "cpp" : null;
