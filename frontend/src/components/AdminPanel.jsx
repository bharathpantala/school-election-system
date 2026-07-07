import { useEffect, useMemo, useState } from "react";

import { api } from "../api";

function typeLabel(type) {
  const map = {
    SCHOOL_STUDENT_LEADER: "School Student Leader (SPL)",
    CLASS_LEADER: "Class Leader",
    PLAYTIME_LEADER: "Playtime Leader (Sports)",
    EVENT_ORGANIZER_LEADER: "Event Organizer Leader",
  };
  return map[type] || type;
}

export default function AdminPanel({ token }) {
  const [elections, setElections] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newElectionTitle, setNewElectionTitle] = useState("");
  const [newElectionType, setNewElectionType] = useState("SCHOOL_STUDENT_LEADER");

  const [candidateName, setCandidateName] = useState("");
  const [candidateSymbol, setCandidateSymbol] = useState("");
  const [candidateNumber, setCandidateNumber] = useState(1);
  const [candidateClass, setCandidateClass] = useState("");

  const selectedElection = useMemo(
    () => elections.find((item) => String(item.id) === String(selectedElectionId)),
    [elections, selectedElectionId]
  );

  const loadElections = async () => {
    const data = await api.listElections(token);
    setElections(data);
    if (!selectedElectionId && data.length > 0) {
      setSelectedElectionId(String(data[0].id));
    }
  };

  const loadTypes = async () => {
    const data = await api.electionTypes();
    setTypes(data);
    if (data.length > 0) setNewElectionType(data[0]);
  };

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadElections(), loadTypes()]);
      } catch (err) {
        setError(err.message || "Failed loading data");
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedElectionId) {
      setCandidates([]);
      setResults(null);
      return;
    }

    (async () => {
      try {
        const [candidateData, resultData] = await Promise.all([
          api.listCandidates(selectedElectionId, token),
          api.electionResults(selectedElectionId, token),
        ]);
        setCandidates(candidateData);
        setResults(resultData);
      } catch (err) {
        setError(err.message || "Failed to load election details");
      }
    })();
  }, [selectedElectionId]);

  const createElection = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.createElection({ title: newElectionTitle, election_type: newElectionType }, token);
      setNewElectionTitle("");
      await loadElections();
      setMessage("Election created");
    } catch (err) {
      setError(err.message || "Failed to create election");
    }
  };

  const addCandidate = async (e) => {
    e.preventDefault();
    if (!selectedElectionId) return;

    setError("");
    setMessage("");
    try {
      await api.addCandidate(
        selectedElectionId,
        {
          name: candidateName,
          symbol: candidateSymbol,
          ballot_number: Number(candidateNumber),
          class_name: candidateClass || null,
        },
        token
      );
      setCandidateName("");
      setCandidateSymbol("");
      setCandidateNumber((prev) => Number(prev) + 1);
      setCandidateClass("");
      const candidateData = await api.listCandidates(selectedElectionId, token);
      const resultData = await api.electionResults(selectedElectionId, token);
      setCandidates(candidateData);
      setResults(resultData);
      setMessage("Candidate added");
    } catch (err) {
      setError(err.message || "Failed to add candidate");
    }
  };

  const toggleElectionStatus = async () => {
    if (!selectedElection) return;

    const status = selectedElection.status === "OPEN" ? "CLOSED" : "OPEN";
    setError("");
    setMessage("");
    try {
      await api.updateElection(selectedElection.id, { status }, token);
      await loadElections();
      setMessage(`Election marked as ${status}`);
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const openVotingTab = () => {
    if (!selectedElection || selectedElection.status !== "OPEN") return;
    const url = new URL(window.location.href);
    url.searchParams.set("kiosk", "1");
    url.searchParams.set("electionId", String(selectedElection.id));
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="panel-grid">
      <section className="card">
        <h2>Create Election</h2>
        <form onSubmit={createElection} className="stack-form">
          <label>
            Election Title
            <input
              placeholder="2026 SPL Final Election"
              value={newElectionTitle}
              onChange={(e) => setNewElectionTitle(e.target.value)}
              required
              minLength={3}
            />
          </label>
          <label>
            Election Type
            <select value={newElectionType} onChange={(e) => setNewElectionType(e.target.value)}>
              {types.map((type) => (
                <option key={type} value={type}>
                  {typeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-btn" type="submit">
            Create Election
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Manage Elections</h2>
        <label>
          Select Election
          <select value={selectedElectionId} onChange={(e) => setSelectedElectionId(e.target.value)}>
            {elections.map((election) => (
              <option key={election.id} value={election.id}>
                #{election.id} - {election.title} ({typeLabel(election.election_type)})
              </option>
            ))}
          </select>
        </label>

        {selectedElection && (
          <>
            <div className="status-pill status-strong">Status: {selectedElection.status}</div>
            <button type="button" onClick={toggleElectionStatus} className="secondary-btn">
              {selectedElection.status === "OPEN" ? "Close Election" : "Re-open Election"}
            </button>
            <button
              type="button"
              onClick={openVotingTab}
              className="primary-btn"
              disabled={selectedElection.status !== "OPEN"}
            >
              Open Voting Page in New Tab
            </button>
          </>
        )}
      </section>

      <section className="card wide-card">
        <h2>Add Candidate</h2>
        <form onSubmit={addCandidate} className="stack-form grid-form">
          <label>
            Candidate Name
            <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} required />
          </label>
          <label>
            Symbol
            <input
              placeholder="Book / 🔥 / Lotus"
              value={candidateSymbol}
              onChange={(e) => setCandidateSymbol(e.target.value)}
              required
            />
          </label>
          <label>
            Ballot Number
            <input
              type="number"
              min={1}
              value={candidateNumber}
              onChange={(e) => setCandidateNumber(e.target.value)}
              required
            />
          </label>
          <label>
            Class (optional)
            <input value={candidateClass} onChange={(e) => setCandidateClass(e.target.value)} />
          </label>
          <button className="primary-btn" type="submit" disabled={!selectedElectionId}>
            Add Candidate
          </button>
        </form>
      </section>

      <section className="card wide-card">
        <h2>Current Ballot</h2>
        <div className="candidate-grid">
          {candidates.map((candidate) => (
            <article key={candidate.id} className="candidate-card">
              <div className="ballot-number">{candidate.ballot_number}</div>
              <div className="candidate-symbol">{candidate.symbol}</div>
              <h3>{candidate.name}</h3>
              <p>{candidate.class_name || "School Candidate"}</p>
            </article>
          ))}
          {candidates.length === 0 && <p>No candidates yet.</p>}
        </div>
      </section>

      <section className="card wide-card">
        <h2>Live Results</h2>
        {results ? (
          <>
            <p>
              Total votes: <strong>{results.total_votes}</strong>
            </p>
            <div className="result-list">
              {results.candidates.map((item) => (
                <div key={item.candidate_id} className="result-item">
                  <span>
                    #{item.ballot_number} {item.symbol} {item.candidate_name}
                  </span>
                  <strong>{item.vote_count} votes</strong>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>Select an election to view results.</p>
        )}
      </section>

      {(message || error) && (
        <section className="card wide-card">
          {message && <p className="ok-box">{message}</p>}
          {error && <p className="error-box">{error}</p>}
        </section>
      )}
    </div>
  );
}
