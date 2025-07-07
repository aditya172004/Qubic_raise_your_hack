import React, { useState, useRef, useEffect } from 'react';

const CodeEditor = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const containerRef = useRef(null);

  const updateLineNumbers = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      const lines = value.split('\n');
      const lineNumbers = lines.map((_, index) => index + 1).join('\n');
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
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
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
              minWidth: '40px',
              lineHeight: '20px',
              paddingRight: '8px'
            }}
          >
            {value.split('\n').map((_, index) => index + 1).join('\n') || '1'}
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
              lineHeight: '20px',
              whiteSpace: 'pre',
              wordWrap: 'off',
              overflowWrap: 'normal',
              minHeight: '100%'
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
  const [contractCode, setContractCode] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const showToast = (message, type = 'info') => {
    // Simple toast implementation since we can't use external toast library
    const toastEl = document.createElement('div');
    toastEl.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600'
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
      showToast('Please select a file or enter contract code to analyze', 'error');
      return;
    }

    setIsAnalyzing(true);

    try {
      let response;
      const formData = new FormData();

      if (selectedFile) {
        // Send the actual file to backend
        formData.append('file', selectedFile);
      } else {
        // Create a blob from the code content and append as file
        const blob = new Blob([contractCode], { type: 'text/plain' });
        formData.append('file', blob, 'contract.cpp');
      }

      response = await fetch('https://qubic-id1q.onrender.com/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const results = await response.json();

      setAnalysisResults(results);
      showToast('Contract analysis completed successfully!', 'success');
    } catch (error) {
      console.error('Analysis error:', error);
      if (error.response && error.response.data) {
        showToast(`Error: ${error.response.data.message || 'Unprocessable data'}`, 'error');
      } else {
        showToast('Failed to analyze contract. Please try again.', 'error');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImportFromGithub = async () => {
    if (!githubUrl.trim()) {
      showToast('Please enter a GitHub URL', 'error');
      return;
    }

    try {
      const rawUrl = githubUrl
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');

      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file from GitHub');
      }

      const code = await response.text();
      setContractCode(code);
      setSelectedFile(null); // Clear selected file when importing from GitHub
      showToast('Code imported from GitHub successfully!', 'success');
    } catch (error) {
      console.error('Import error:', error);
      showToast('Failed to import from GitHub. Please check the URL.', 'error');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) {
      showToast("File not uploaded", 'error');
      return;
    }

    // Check file type
    const allowedTypes = ['.h', '.cpp'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      showToast('Please select a valid contract file (.cpp, .h, .sol, .js, .ts, .py, .rs, .go, .txt)', 'error');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    // Store the selected file
    setSelectedFile(file);

    // Read file content for display in editor
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setContractCode(content);
      showToast(`File "${file.name}" selected successfully!`, 'success');
    };

    reader.onerror = () => {
      showToast('Failed to read file. Please try again.', 'error');
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
            <h2 className="text-2xl font-bold text-white mb-6">Smart Contract Code</h2>

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
                  'Analyze Contract'
                )}
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">Analysis Results</h2>

            <div className="h-96 bg-gray-900 rounded-lg border border-gray-600 overflow-auto">
              {analysisResults ? (
                <div className="p-6">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-100 leading-relaxed">
                    {JSON.stringify(analysisResults, null, 2)}
                  </pre>
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



// import React, { useState, useRef, useEffect } from 'react';

// import * as THREE from 'three';



// const CodeEditor = ({ value, onChange, placeholder }) => {

//   const textareaRef = useRef(null);

//   const lineNumbersRef = useRef(null);

//   const containerRef = useRef(null);



//   const updateLineNumbers = () => {

//     if (textareaRef.current && lineNumbersRef.current) {

//       const lines = value.split('\n');

//       const lineNumbers = lines.map((_, index) => index + 1).join('\n');

//       lineNumbersRef.current.textContent = lineNumbers;

//       lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;

//     }

//   };



//   useEffect(() => {

//     updateLineNumbers();

//   }, [value]);



//   const handleScroll = () => {

//     if (lineNumbersRef.current && textareaRef.current) {

//       lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;

//     }

//   };



//   const handleKeyDown = (e) => {

//     if (e.key === 'Tab') {

//       e.preventDefault();

//       const start = e.target.selectionStart;

//       const end = e.target.selectionEnd;

//       const newValue = value.substring(0, start) + '  ' + value.substring(end);

//       onChange(newValue);



//       setTimeout(() => {

//         e.target.selectionStart = e.target.selectionEnd = start + 2;

//       }, 0);

//     }

//   };



//   return (

//     <div className="w-full h-80 bg-white rounded-xl border border-gray-200 overflow-hidden relative shadow-sm hover:shadow-md transition-shadow duration-300">

//       <div className="flex h-full">

//         <div className="bg-gray-50 text-gray-500 text-sm font-mono leading-5 p-4 pr-2 select-none overflow-hidden flex-shrink-0 border-r border-gray-200">

//           <pre

//             ref={lineNumbersRef}

//             className="text-right whitespace-pre overflow-hidden h-full"

//             style={{

//               minWidth: '40px',

//               lineHeight: '20px',

//               paddingRight: '8px'

//             }}

//           >

//             {value.split('\n').map((_, index) => index + 1).join('\n') || '1'}

//           </pre>

//         </div>



//         <div className="flex-1 relative overflow-auto">

//           <textarea

//             ref={textareaRef}

//             value={value}

//             onChange={(e) => onChange(e.target.value)}

//             onScroll={handleScroll}

//             onKeyDown={handleKeyDown}

//             placeholder={placeholder}

//             className="w-full h-full bg-transparent text-gray-800 font-mono text-sm leading-5 p-4 pl-3 resize-none outline-none border-none block min-w-full placeholder-gray-400"

//             style={{

//               tabSize: 2,

//               fontFamily: 'Menlo, Monaco, "Courier New", monospace',

//               lineHeight: '20px',

//               whiteSpace: 'pre',

//               wordWrap: 'off',

//               overflowWrap: 'normal',

//               minHeight: '100%'

//             }}

//             spellCheck={false}

//             wrap="off"

//           />

//         </div>

//       </div>

//     </div>

//   );

// };



// const ThreeJSBackground = () => {

//   const mountRef = useRef(null);

//   const sceneRef = useRef(null);

//   const rendererRef = useRef(null);

//   const frameRef = useRef(null);



//   useEffect(() => {

//     if (!mountRef.current) return;



//     // Scene setup

//     const scene = new THREE.Scene();

//     const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

//     const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    

//     renderer.setSize(window.innerWidth, window.innerHeight);

//     renderer.setClearColor(0x000000, 0);

//     mountRef.current.appendChild(renderer.domElement);



//     // Create floating particles

//     const particleCount = 50;

//     const particles = new THREE.BufferGeometry();

//     const positions = new Float32Array(particleCount * 3);

//     const colors = new Float32Array(particleCount * 3);



//     for (let i = 0; i < particleCount; i++) {

//       positions[i * 3] = (Math.random() - 0.5) * 20;

//       positions[i * 3 + 1] = (Math.random() - 0.5) * 20;

//       positions[i * 3 + 2] = (Math.random() - 0.5) * 20;



//       // Google-like colors (blue spectrum)

//       colors[i * 3] = 0.2 + Math.random() * 0.3;     // R

//       colors[i * 3 + 1] = 0.4 + Math.random() * 0.4; // G

//       colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B

//     }



//     particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

//     particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));



//     const particleMaterial = new THREE.PointsMaterial({

//       size: 0.02,

//       vertexColors: true,

//       transparent: true,

//       opacity: 0.6

//     });



//     const particleSystem = new THREE.Points(particles, particleMaterial);

//     scene.add(particleSystem);



//     camera.position.z = 5;



//     sceneRef.current = scene;

//     rendererRef.current = renderer;



//     // Animation loop

//     const animate = () => {

//       frameRef.current = requestAnimationFrame(animate);

      

//       particleSystem.rotation.x += 0.0005;

//       particleSystem.rotation.y += 0.0008;

      

//       renderer.render(scene, camera);

//     };



//     animate();



//     // Handle resize

//     const handleResize = () => {

//       camera.aspect = window.innerWidth / window.innerHeight;

//       camera.updateProjectionMatrix();

//       renderer.setSize(window.innerWidth, window.innerHeight);

//     };



//     window.addEventListener('resize', handleResize);



//     return () => {

//       window.removeEventListener('resize', handleResize);

//       if (frameRef.current) {

//         cancelAnimationFrame(frameRef.current);

//       }

//       if (mountRef.current && renderer.domElement) {

//         mountRef.current.removeChild(renderer.domElement);

//       }

//       renderer.dispose();

//     };

//   }, []);



//   return (

//     <div 

//       ref={mountRef} 

//       className="fixed inset-0 pointer-events-none z-0"

//       style={{ opacity: 0.3 }}

//     />

//   );

// };



// const App = () => {

//   const [contractCode, setContractCode] = useState('');

//   const [githubUrl, setGithubUrl] = useState('');

//   const [analysisResults, setAnalysisResults] = useState(null);

//   const [isAnalyzing, setIsAnalyzing] = useState(false);

//   const [selectedFile, setSelectedFile] = useState(null);



//   const showToast = (message, type = 'info') => {

//     const toastEl = document.createElement('div');

//     toastEl.className = `fixed top-6 right-6 p-4 rounded-lg text-white z-50 transform transition-all duration-300 translate-x-full ${

//       type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-blue-500'

//     }`;

//     toastEl.textContent = message;

//     document.body.appendChild(toastEl);



//     setTimeout(() => {

//       toastEl.classList.remove('translate-x-full');

//     }, 100);



//     setTimeout(() => {

//       toastEl.classList.add('translate-x-full');

//       setTimeout(() => {

//         toastEl.remove();

//       }, 300);

//     }, 3000);

//   };



//   const handleAnalyzeContract = async () => {

//     if (!selectedFile && !contractCode.trim()) {

//       showToast('Please select a file or enter contract code to analyze', 'error');

//       return;

//     }



//     setIsAnalyzing(true);



//     try {

//       let response;

//       const formData = new FormData();



//       if (selectedFile) {

//         formData.append('file', selectedFile);

//       } else {

//         const blob = new Blob([contractCode], { type: 'text/plain' });

//         formData.append('file', blob, 'contract.cpp');

//       }



//       response = await fetch('https://qubic-id1q.onrender.com/analyze', {

//         method: 'POST',

//         body: formData,

//       });



//       if (!response.ok) {

//         throw new Error('Analysis failed');

//       }



//       const results = await response.json();

//       setAnalysisResults(results);

//       showToast('Contract analysis completed successfully!', 'success');

//     } catch (error) {

//       console.error('Analysis error:', error);

//       if (error.response && error.response.data) {

//         showToast(`Error: ${error.response.data.message || 'Unprocessable data'}`, 'error');

//       } else {

//         showToast('Failed to analyze contract. Please try again.', 'error');

//       }

//     } finally {

//       setIsAnalyzing(false);

//     }

//   };



//   const handleImportFromGithub = async () => {

//     if (!githubUrl.trim()) {

//       showToast('Please enter a GitHub URL', 'error');

//       return;

//     }



//     try {

//       const rawUrl = githubUrl

//         .replace('github.com', 'raw.githubusercontent.com')

//         .replace('/blob/', '/');



//       const response = await fetch(rawUrl);

//       if (!response.ok) {

//         throw new Error('Failed to fetch file from GitHub');

//       }



//       const code = await response.text();

//       setContractCode(code);

//       setSelectedFile(null);

//       showToast('Code imported from GitHub successfully!', 'success');

//     } catch (error) {

//       console.error('Import error:', error);

//       showToast('Failed to import from GitHub. Please check the URL.', 'error');

//     }

//   };



//   const handleFileUpload = (event) => {

//     const file = event.target.files[0];

//     if (!file) {

//       showToast("File not uploaded", 'error');

//       return;

//     }



//     const allowedTypes = ['.h', '.cpp', '.sol', '.js', '.ts', '.py', '.rs', '.go', '.txt'];

//     const fileExtension = '.' + file.name.split('.').pop().toLowerCase();



//     if (!allowedTypes.includes(fileExtension)) {

//       showToast('Please select a valid contract file (.cpp, .h, .sol, .js, .ts, .py, .rs, .go, .txt)', 'error');

//       return;

//     }



//     if (file.size > 5 * 1024 * 1024) {

//       showToast('File size must be less than 5MB', 'error');

//       return;

//     }



//     setSelectedFile(file);



//     const reader = new FileReader();

//     reader.onload = (e) => {

//       const content = e.target.result;

//       setContractCode(content);

//       showToast(`File "${file.name}" selected successfully!`, 'success');

//     };



//     reader.onerror = () => {

//       showToast('Failed to read file. Please try again.', 'error');

//     };



//     reader.readAsText(file);

//   };



//   return (

//     <div className="min-h-screen bg-gray-50" style={{ scrollBehavior: 'smooth' }}>

//       <ThreeJSBackground />

      

//       {/* Header */}

//       <div className="relative z-10 bg-white shadow-sm">

//         <div className="max-w-7xl mx-auto px-6 py-16">

//           <div className="text-center">

//             <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">

//               Smart Contract Auditor

//             </h1>

//             <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">

//               Analyze your smart contracts with advanced security rules and best practices

//             </p>

//           </div>

//         </div>

//       </div>



//       {/* Main Content */}

//       <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

//           {/* Left Panel */}

//           <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">

//             <h2 className="text-2xl font-light text-gray-900 mb-8">Contract Code</h2>



//             <div className="space-y-6">

//               <CodeEditor

//                 value={contractCode}

//                 onChange={setContractCode}

//                 placeholder="Enter your smart contract code here..."

//               />



//               <div className="flex items-center justify-between text-sm text-gray-500">

//                 <span>{contractCode.length} characters</span>

//                 {selectedFile && (

//                   <span className="text-blue-600 font-medium">

//                     {selectedFile.name}

//                   </span>

//                 )}

//               </div>



//               {/* File Upload Section */}

//               <div className="border-t border-gray-200 pt-6">

//                 <div className="flex flex-col sm:flex-row gap-4 mb-4">

//                   <div className="flex-1 relative">

//                     <input

//                       type="file"

//                       id="fileInput"

//                       onChange={handleFileUpload}

//                       accept=".sol,.cpp,.js,.ts,.py,.rs,.go,.txt,.h"

//                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"

//                     />

//                     <label

//                       htmlFor="fileInput"

//                       className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 cursor-pointer"

//                     >

//                       <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />

//                       </svg>

//                       Choose File

//                     </label>

//                   </div>

//                 </div>

//                 <p className="text-xs text-gray-500">

//                   Supported formats: .sol, .cpp, .js, .ts, .py, .rs, .go, .txt, .h (Max 5MB)

//                 </p>

//               </div>



//               {/* GitHub Import */}

//               <div className="border-t border-gray-200 pt-6">

//                 <div className="flex flex-col sm:flex-row gap-4">

//                   <input

//                     type="text"

//                     value={githubUrl}

//                     onChange={(e) => setGithubUrl(e.target.value)}

//                     placeholder="GitHub raw file URL"

//                     className="flex-1 bg-white text-gray-900 rounded-lg px-4 py-3 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors duration-200"

//                   />

//                   <button

//                     onClick={handleImportFromGithub}

//                     className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-gray-300"

//                   >

//                     Import from GitHub

//                   </button>

//                 </div>

//               </div>



//               {/* Analyze Button */}

//               <button

//                 onClick={handleAnalyzeContract}

//                 disabled={isAnalyzing}

//                 className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-lg font-medium text-lg transition-colors duration-200 disabled:cursor-not-allowed"

//               >

//                 {isAnalyzing ? (

//                   <div className="flex items-center justify-center space-x-2">

//                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>

//                     <span>Analyzing...</span>

//                   </div>

//                 ) : (

//                   'Analyze Contract'

//                 )}

//               </button>

//             </div>

//           </div>



//           {/* Right Panel */}

//           <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">

//             <h2 className="text-2xl font-light text-gray-900 mb-8">Analysis Results</h2>



//             <div className="h-96 bg-gray-50 rounded-xl border border-gray-200 overflow-auto">

//               {analysisResults ? (

//                 <div className="p-6">

//                   <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">

//                     {JSON.stringify(analysisResults, null, 2)}

//                   </pre>

//                 </div>

//               ) : (

//                 <div className="flex flex-col items-center justify-center h-full text-center p-6">

//                   <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">

//                     <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />

//                     </svg>

//                   </div>

//                   <p className="text-gray-600 text-lg font-medium mb-2">

//                     Ready to analyze

//                   </p>

//                   <p className="text-gray-500">

//                     Upload or paste your contract code to begin

//                   </p>

//                 </div>

//               )}

//             </div>

//           </div>

//         </div>

//       </div>

//     </div>

//   );

// };



// export default App;

