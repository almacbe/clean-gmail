type AccountStatsProps = {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
};

export function AccountStats({
  emailAddress,
  messagesTotal,
  threadsTotal,
}: AccountStatsProps) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Account Overview</h1>
      <p className="mb-6 text-base-content/70">{emailAddress}</p>
      <div className="stats stats-vertical sm:stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-title">Total Messages</div>
          <div className="stat-value text-primary" data-testid="messages-total">
            {messagesTotal.toLocaleString()}
          </div>
          <div className="stat-desc">Emails in your mailbox</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Threads</div>
          <div
            className="stat-value text-secondary"
            data-testid="threads-total"
          >
            {threadsTotal.toLocaleString()}
          </div>
          <div className="stat-desc">Conversation threads</div>
        </div>
        <div className="stat">
          <div className="stat-title">Account</div>
          <div className="stat-value text-accent text-lg">{emailAddress}</div>
          <div className="stat-desc">Connected Gmail account</div>
        </div>
      </div>
    </div>
  );
}
