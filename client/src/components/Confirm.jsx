import { createContext, useCallback, useContext, useRef, useState } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const confirmDialog = useCallback((message) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ message });
    });
  }, []);

  function respond(result) {
    setDialog(null);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  }

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}
      {dialog && (
        <div className="modal-backdrop" onClick={() => respond(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p>{dialog.message}</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => respond(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => respond(true)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
