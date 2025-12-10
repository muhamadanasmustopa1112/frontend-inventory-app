"use client";

type ActivityLog = {
  id: number;
  action: string;
  table_name: string | null;
  record_id: number | null;
  user_id: number | null;
  user_name?: string | null;
  before_data?: any;
  after_data?: any;
  description?: string | null;
  created_at: string;
};

export default function LogDetailModal({ log, onClose }: { log: ActivityLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-md shadow-lg w-[90vw] max-w-4xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Log #{log.id}</h3>
            <p className="text-sm text-muted-foreground">{log.table_name} • {log.action} • {new Date(log.created_at).toLocaleString()}</p>
          </div>
          <div>
            <button className="btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Before</h4>
            <pre className="text-xs max-h-[48vh] overflow-auto rounded p-2 bg-slate-50 border">{formatJson(log.before_data)}</pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">After</h4>
            <pre className="text-xs max-h-[48vh] overflow-auto rounded p-2 bg-slate-50 border">{formatJson(log.after_data)}</pre>
          </div>
        </div>

        {log.description && <div className="mt-4"><strong>Description:</strong> <p>{log.description}</p></div>}
      </div>
    </div>
  );
}

function formatJson(obj: any) {
  try {
    return JSON.stringify(obj ?? {}, null, 2);
  } catch (e) {
    return String(obj);
  }
}
