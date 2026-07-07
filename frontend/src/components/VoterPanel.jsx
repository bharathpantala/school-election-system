import { useEffect, useState } from "react";

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

export default function VoterPanel({ token, initialElectionId = "", kioskMode = false }) {
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [readyForNextStudent, setReadyForNextStudent] = useState(true);
  const [gapRemaining, setGapRemaining] = useState(0);
  const [voteGapSeconds, setVoteGapSeconds] = useState(3);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const list = await api.listElections(token);
        const openElections = list.filter((election) => election.status === "OPEN");
        setElections(openElections);
        try {
          const appInfo = await api.appInfo();
          if (appInfo?.kiosk_vote_gap_seconds && Number(appInfo.kiosk_vote_gap_seconds) > 0) {
            setVoteGapSeconds(Number(appInfo.kiosk_vote_gap_seconds));
          }
        } catch {
          // Fallback keeps default gap when app info is unavailable.
        }
        if (openElections.length > 0) {
          const preferredElection = openElections.find(
            (election) => String(election.id) === String(initialElectionId)
          );
          setSelectedElection(preferredElection || openElections[0]);
        }
      } catch (err) {
        setError(err.message || "Could not load elections");
      }
    })();
  }, [initialElectionId]);

  useEffect(() => {
    if (!selectedElection) return;

    setShowResults(false);
    setReadyForNextStudent(true);
    setGapRemaining(0);
    setError("");
    setMessage("");

    (async () => {
      try {
        const [candidateData, resultData] = await Promise.all([
          api.listCandidates(selectedElection.id, token),
          api.electionResults(selectedElection.id, token),
        ]);
        setCandidates(candidateData);
        setResults(resultData);
      } catch (err) {
        setError(err.message || "Could not load ballot");
      }
    })();
  }, [selectedElection]);

  const vote = async (candidateId) => {
    if (!selectedElection) return;
    if (kioskMode && !readyForNextStudent) return;

    setError("");
    setMessage("");
    try {
      await api.castVote(selectedElection.id, candidateId, token);
      if (kioskMode) {
        setReadyForNextStudent(false);
        setGapRemaining(voteGapSeconds);
        setMessage("Vote recorded. Please wait for next student window.");
      } else {
        setMessage("Vote recorded. Ready for next student.");
      }
      const resultData = await api.electionResults(selectedElection.id, token);
      setResults(resultData);
    } catch (err) {
      setError(err.message || "Vote failed");
    }
  };

  useEffect(() => {
    if (!kioskMode || readyForNextStudent || gapRemaining <= 0) return;

    const timer = setTimeout(() => {
      setGapRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [kioskMode, readyForNextStudent, gapRemaining]);

  const allowNextStudent = () => {
    if (gapRemaining > 0) return;
    setReadyForNextStudent(true);
    setMessage("Voting station ready for next student.");
  };

  return (
    <div className="panel-grid">
      <section className="card wide-card">
        <h2>Open Elections</h2>
        <div className="election-tabs">
          {elections.map((election) => (
            <button
              key={election.id}
              className={selectedElection?.id === election.id ? "tab-active" : ""}
              onClick={() => setSelectedElection(election)}
              type="button"
            >
              {election.title}
              <span>{typeLabel(election.election_type)}</span>
            </button>
          ))}
        </div>
        {elections.length === 0 && <p>No open elections available now.</p>}
      </section>

      <section className="card wide-card">
        <h2>Exclusive Voting View</h2>
        <p>For open elections, click directly on a candidate tile to cast your vote.</p>

        {selectedElection && (
          <div className="status-pill status-strong status-with-light">
            {kioskMode && (
              <span className={`signal-light ${readyForNextStudent ? "signal-green" : "signal-red"}`} />
            )}
            <span>
              {kioskMode
                ? readyForNextStudent
                  ? "Ready for next student vote"
                  : `Voted already - wait ${gapRemaining}s before next student`
                : "Vote station active - click one candidate tile for each student"}
            </span>
          </div>
        )}

        {kioskMode && (
          <div className="kiosk-controls">
            <button
              className="secondary-btn"
              type="button"
              onClick={allowNextStudent}
              disabled={gapRemaining > 0}
            >
              {gapRemaining > 0 ? `Next Student in ${gapRemaining}s` : "Start Next Student Vote"}
            </button>
          </div>
        )}

        {selectedElection ? (
          <div className="candidate-grid">
            {candidates.map((candidate) => (
              <button
                key={candidate.id}
                className={`candidate-card vote-tile ${kioskMode && !readyForNextStudent ? "tile-disabled" : ""}`}
                onClick={() => vote(candidate.id)}
                type="button"
                disabled={kioskMode && !readyForNextStudent}
                aria-label={`Vote for ${candidate.name} with ballot number ${candidate.ballot_number}`}
              >
                <div className="ballot-number">{candidate.ballot_number}</div>
                <div className="candidate-symbol">{candidate.symbol}</div>
                <h3>{candidate.name}</h3>
                <p>{candidate.class_name || "School Candidate"}</p>
              </button>
            ))}
          </div>
        ) : (
          <p>Select an election to vote.</p>
        )}
      </section>

      {!kioskMode && (
        <section className="card wide-card">
          <div className="result-header-row">
            <h2>Election Results</h2>
            <button className="secondary-btn" type="button" onClick={() => setShowResults((prev) => !prev)}>
              {showResults ? "Hide Results" : "Show Results"}
            </button>
          </div>

          {showResults ? (
            results ? (
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
            ) : (
              <p>Results will appear after selecting an election.</p>
            )
          ) : (
            <p>Results are hidden while voting to keep this view focused and exclusive.</p>
          )}
        </section>
      )}

      {(message || error) && (
        <section className="card wide-card">
          {message && <p className="ok-box">{message}</p>}
          {error && <p className="error-box">{error}</p>}
        </section>
      )}
    </div>
  );
}
