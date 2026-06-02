import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Overview from "./components/Overview";
import SlowEndpoints from "./components/SlowEndpoints";
import TopEndpoints from "./components/TopEndpoints";
import StatusBreakdown from "./components/StatusBreakdown";
import TopIPs from "./components/TopIPs";
import MethodBreakdown from "./components/MethodBreakdown";
import SkippedLines from "./components/SkippedLines";
import RequestsOverTime from "./components/RequestsOverTime";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [analyzedAt, setAnalyzedAt] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  async function analyzeFile(file) {
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError(null);
    setData(null);
    const formData = new FormData();
    formData.append("logfile", file);
    try {
      const res = await axios.post(`${API_URL}/analyze`, formData);
      setData(res.data);
      setAnalyzedAt(new Date().toISOString());
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to analyze. Is the backend running?",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFileInput(e) {
    analyzeFile(e.target.files[0]);
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) analyzeFile(file);
  }, []);

  function handleReset() {
    setData(null);
    setError(null);
    setFileName(null);
    setAnalyzedAt(null);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-dot" />
            <span className="logo-bracket">[</span>
            LOG_ANALYZER
            <span className="logo-bracket">]</span>
          </div>
          <div className="header-divider" />
          <div className="header-status">
            <div className="status-dot" />
            SYSTEM NOMINAL
          </div>
          {data && (
            <>
              <div className="header-divider" />
              <div className="header-status">{data.meta?.fileName}</div>
            </>
          )}
        </div>

        <div className="theme-toggle">
          <span className="toggle-label">{theme === "dark" ? "☾" : "☀"}</span>
          <div
            className={`toggle-track ${theme === "light" ? "on" : ""}`}
            onClick={toggleTheme}
            role="button"
            aria-label="Toggle theme"
          >
            <div className="toggle-thumb" />
          </div>
        </div>

        {data && (
          <button className="btn-reset" onClick={handleReset}>
            ← NEW FILE
          </button>
        )}
      </header>

      <main className="main">
        {!data && !loading && (
          <div className="upload-screen">
            <div
              className={`upload-card ${dragging ? "upload-card--dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-tag">Log Analysis Tool</div>

              <div className="upload-icon-wrap">
                {dragging ? (
                  <div className="upload-drop-indicator">DROP IT</div>
                ) : (
                  <div className="upload-icon">↑</div>
                )}
              </div>

              <h1>{dragging ? "Release to analyze" : "Drop a log file."}</h1>
              <p>
                Drag and drop any server log file, or click to browse. Handles
                mixed formats, malformed lines, JSON entries, and every
                timestamp variant your broken logging config produced.
              </p>

              <label className="upload-btn">
                ↑ SELECT LOG FILE
                <input
                  type="file"
                  accept=".log,.txt"
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />
              </label>

              {error && <div className="error-msg">ERR: {error}</div>}

              <div className="upload-formats">
                {[
                  "ISO 8601",
                  "SLASH FORMAT",
                  "NAMED MONTH",
                  "UNIX EPOCH",
                  "JSON LINES",
                  "MALFORMED",
                ].map((f) => (
                  <span className="fmt-tag" key={f}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="upload-screen">
            <div className="upload-card">
              <div className="loader-wrap">
                <div className="loader-bars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div className="loader-bar" key={i} />
                  ))}
                </div>
                <div className="loader-text">
                  PARSING {fileName?.toUpperCase()}
                </div>
                <div className="loader-sub">
                  Normalizing timestamps · Classifying entries · Computing stats
                </div>
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className="dashboard">
            <div className="dashboard-header">
              <div className="dash-file">
                <span className="dash-filename">/{data.meta?.fileName}</span>
                <span className="dash-meta">
                  {data.meta?.fileSizeKB} KB ·{" "}
                  {data.meta?.totalLines?.toLocaleString()} lines
                </span>
              </div>
              <div className="dash-time">
                ANALYZED {new Date(analyzedAt).toLocaleTimeString()}
              </div>
            </div>

            <Overview data={data.overview} />
            <RequestsOverTime data={data.requestsOverTime} />

            <div className="grid-2">
              <StatusBreakdown data={data.statusBreakdown} />
              <MethodBreakdown data={data.methodBreakdown} />
            </div>

            <div className="grid-2">
              <SlowEndpoints data={data.slowestEndpoints} />
              <TopEndpoints data={data.topEndpoints} />
            </div>

            <div className="grid-2">
              <TopIPs data={data.topIPs} />
              <SkippedLines data={data.skippedSummary} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
