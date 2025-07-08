import React, { useState, useRef, useEffect } from "react";

const CodeEditor = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const containerRef = useRef(null);

  const updateLineNumbers = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      const lines = value.split("\n");
      const lineNumbers = lines.map((_, index) => index + 1).join("\n");
      lineNumbersRef.current.textContent = lineNumbers;

      // Sync scroll position
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  useEffect(() => {
    updateLineNumbers();
  }, [value]);

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      // Sync vertical scroll
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="w-full h-80 bg-gray-900 rounded-lg border border-gray-600 overflow-hidden relative">
      <div className="flex h-full">
        {/* Line Numbers */}
        <div className="bg-gray-800 text-gray-400 text-sm font-mono leading-5 p-4 pr-2 select-none overflow-hidden flex-shrink-0">
          <pre
            ref={lineNumbersRef}
            className="text-right whitespace-pre overflow-hidden h-full"
            style={{
              minWidth: "40px",
              lineHeight: "20px",
              paddingRight: "8px",
            }}
          >
            {value
              .split("\n")
              .map((_, index) => index + 1)
              .join("\n") || "1"}
          </pre>
        </div>

        {/* Vertical Divider */}
        <div className="w-px bg-gray-600 flex-shrink-0"></div>

        {/* Code Editor Container */}
        <div className="flex-1 relative overflow-auto">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full h-full bg-transparent text-gray-100 font-mono text-sm leading-5 p-4 pl-3 resize-none outline-none border-none block min-w-full"
            style={{
              tabSize: 2,
              fontFamily: 'Menlo, Monaco, "Courier New", monospace',
              lineHeight: "20px",
              whiteSpace: "pre",
              wordWrap: "off",
              overflowWrap: "normal",
              minHeight: "100%",
            }}
            spellCheck={false}
            wrap="off"
          />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [contractCode, setContractCode] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const showToast = (message, type = "info") => {
    // Simple toast implementation since we can't use external toast library
    const toastEl = document.createElement("div");
    toastEl.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
      type === "error"
        ? "bg-red-600"
        : type === "success"
        ? "bg-green-600"
        : "bg-blue-600"
    }`;
    toastEl.textContent = message;
    document.body.appendChild(toastEl);

    setTimeout(() => {
      toastEl.remove();
    }, 3000);
  };

  const handleAnalyzeContract = async () => {
    // If no file is selected and no code is entered, show error
    if (!selectedFile && !contractCode.trim()) {
      showToast(
        "Please select a file or enter contract code to analyze",
        "error"
      );
      return;
    }

    setIsAnalyzing(true);

    try {
      let response;
      const formData = new FormData();

      if (selectedFile) {
        // Send the actual file to backend
        formData.append("file", selectedFile);
      } else {
        // Create a blob from the code content and append as file
        const blob = new Blob([contractCode], { type: "text/plain" });
        formData.append("file", blob, "contract.cpp");
      }

      response = await fetch("https://qubic-id1q.onrender.com/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const results = await response.json();

      setAnalysisResults(results);
      showToast("Contract analysis completed successfully!", "success");
    } catch (error) {
      console.error("Analysis error:", error);
      if (error.response && error.response.data) {
        showToast(
          `Error: ${error.response.data.message || "Unprocessable data"}`,
          "error"
        );
      } else {
        showToast("Failed to analyze contract. Please try again.", "error");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImportFromGithub = async () => {
    if (!githubUrl.trim()) {
      showToast("Please enter a GitHub URL", "error");
      return;
    }

    try {
      const rawUrl = githubUrl
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/");

      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch file from GitHub");
      }

      const code = await response.text();
      setContractCode(code);
      setSelectedFile(null); // Clear selected file when importing from GitHub
      showToast("Code imported from GitHub successfully!", "success");
    } catch (error) {
      console.error("Import error:", error);
      showToast("Failed to import from GitHub. Please check the URL.", "error");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      showToast("File not uploaded", "error");
      return;
    }

    // Check file type
    const allowedTypes = [".h", ".cpp"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      showToast(
        "Please select a valid contract file (.cpp, .h, .sol, .js, .ts, .py, .rs, .go, .txt)",
        "error"
      );
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", "error");
      return;
    }

    // Store the selected file
    setSelectedFile(file);

    // Read file content for display in editor
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setContractCode(content);
      showToast(`File "${file.name}" selected successfully!`, "success");
    };

    reader.onerror = () => {
      showToast("Failed to read file. Please try again.", "error");
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Smart Contract Auditor
          </h1>
          <p className="text-xl text-indigo-100">
            Analyze your smart contracts against custom security rules
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              Smart Contract Code
            </h2>

            <div className="space-y-4">
              {/* Code Editor */}
              <CodeEditor
                value={contractCode}
                onChange={setContractCode}
                placeholder="Paste your smart contract code here..."
              />

              <div className="text-sm text-gray-400">
                {contractCode.length} characters
                {selectedFile && (
                  <span className="ml-4 text-blue-400">
                    Selected file: {selectedFile.name}
                  </span>
                )}
              </div>

              {/* File Upload Section */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <input
                      type="file"
                      id="fileInput"
                      onChange={handleFileUpload}
                      accept=".sol,.cpp,.js,.ts,.py,.rs,.go,.txt,.h"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <label
                      htmlFor="fileInput"
                      className="flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg cursor-pointer"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Choose File from PC
                    </label>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Supported formats: .h, .cpp (Max 5MB)
                </p>
              </div>

              {/* GitHub Import */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="Paste raw GitHub code file URL here"
                    className="flex-1 bg-gray-900 text-gray-100 rounded-lg px-4 py-3 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={handleImportFromGithub}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    Import from GitHub
                  </button>
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyzeContract}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing Contract...</span>
                  </div>
                ) : (
                  "Analyze Contract"
                )}
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              Analysis Results
            </h2>

            <div className="h-96 bg-gray-900 rounded-lg border border-gray-600 overflow-auto">
              {analysisResults ? (
                <div className="p-6">
                  {analysisResults.issues &&
                  analysisResults.issues.length > 0 ? (
                    <div className="text-gray-100 font-mono text-sm leading-relaxed">
                      <div className="text-white font-bold mb-4">
                        Analysis Results - {analysisResults.issues.length} Issue
                        {analysisResults.issues.length !== 1 ? "s" : ""} Found
                      </div>
                      <div className="border-b border-gray-700 mb-4"></div>

                      {analysisResults.issues.map((issue, index) => (
                        <div key={index} className="mb-6">
                          <div className="text-yellow-400 font-semibold">
                            Issue #{index + 1}
                          </div>
                          <div className="mt-1">
                            <span className="text-gray-400">Line:</span>{" "}
                            <span className="text-white">{issue.line}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-gray-400">Type:</span>{" "}
                            <span
                              className={
                                issue.type === "error"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }
                            >
                              {issue.type.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-gray-400">Message:</span>
                            <div className="text-gray-100 mt-1 pl-2 border-l-2 border-gray-600">
                              {issue.message}
                            </div>
                          </div>
                          {index < analysisResults.issues.length - 1 && (
                            <div className="border-b border-gray-700 mt-4"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <p className="text-green-300 text-lg font-semibold mb-2">
                        No Issues Found
                      </p>
                      <p className="text-gray-400">
                        Your contract passed the security analysis
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mb-4">
                    <div className="w-8 h-8 bg-white rounded-full opacity-80"></div>
                  </div>
                  <p className="text-cyan-300 text-lg font-semibold mb-2">
                    Analysis results will appear here
                  </p>
                  <p className="text-gray-400">
                    Enter contract code to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
