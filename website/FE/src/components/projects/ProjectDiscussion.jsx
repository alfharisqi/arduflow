import { useEffect, useMemo, useRef, useState } from 'react';

import {
  acceptProjectDiscussionReply,
  createProjectDiscussion,
  fetchProjectDiscussions,
  replyProjectDiscussion,
  updateProjectDiscussionStatus,
} from '../../services/projectApi.js';
import { getStoredUserToken } from '../../services/authSession.js';
import { connectProjectDiscussionRealtime } from '../../services/projectDiscussionRealtime.js';

const CATEGORIES = [
  { value: 'question', label: 'Pertanyaan' },
  { value: 'development', label: 'Pengembangan' },
  { value: 'modification', label: 'Modifikasi' },
  { value: 'collaboration', label: 'Kolaborasi' },
  { value: 'technical', label: 'Teknis' },
];

const PAGE_SIZE = 5;

function categoryLabel(value) {
  return CATEGORIES.find((category) => category.value === value)?.label || 'Diskusi';
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

function AuthorLine({ item }) {
  return (
    <div className="project-discussion__author">
      <span className="project-discussion__avatar" aria-hidden="true">
        {String(item.authorName || 'U').trim().charAt(0).toUpperCase()}
      </span>
      <strong>{item.authorName || 'User'}</strong>
      {item.isProjectOwner ? <span className="project-discussion__owner-badge">Owner Proyek</span> : null}
      <time>{formatDate(item.createdAt)}</time>
    </div>
  );
}

export function ProjectDiscussion({ project }) {
  const [data, setData] = useState({ threads: [], total: 0, openCount: 0, viewer: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState('connecting');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState({ category: 'question', title: '', message: '' });
  const [expanded, setExpanded] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const realtimeRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const projectId = project?.id;
  const isLoggedIn = Boolean(getStoredUserToken());

  async function loadDiscussions({ quiet = false } = {}) {
    if (!projectId) return;
    if (!quiet) setLoading(true);
    try {
      const nextData = await fetchProjectDiscussions(projectId);
      setData(nextData);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Diskusi proyek gagal dimuat.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    loadDiscussions();
    realtimeRef.current = connectProjectDiscussionRealtime(projectId, {
      onStatus: setConnection,
      onEvent: () => {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = window.setTimeout(() => loadDiscussions({ quiet: true }), 250);
      },
    });

    return () => {
      window.clearTimeout(refreshTimerRef.current);
      realtimeRef.current?.close();
      realtimeRef.current = null;
    };
  }, [projectId]);

  const filteredThreads = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return (data.threads || []).filter((thread) => {
      const matchesSearch = !keyword || `${thread.title} ${thread.message} ${thread.authorName}`.toLowerCase().includes(keyword);
      const matchesCategory = category === 'all' || thread.category === category;
      const matchesStatus = status === 'all' || thread.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [data.threads, search, category, status]);

  const pageCount = Math.max(1, Math.ceil(filteredThreads.length / PAGE_SIZE));
  const visibleThreads = filteredThreads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, category, status]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  async function commit(action, event = {}) {
    setSubmitting(true);
    setError('');
    try {
      const nextData = await action();
      setData(nextData);
      realtimeRef.current?.publish(event);
      return true;
    } catch (actionError) {
      setError(actionError.message || 'Diskusi proyek gagal diperbarui.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    const saved = await commit(
      () => createProjectDiscussion(projectId, draft),
      { action: 'thread.created' },
    );
    if (saved) {
      setDraft({ category: 'question', title: '', message: '' });
      setShowForm(false);
      setPage(1);
    }
  }

  async function handleReply(event, threadId) {
    event.preventDefault();
    const message = String(replyDrafts[threadId] || '').trim();
    if (!message) return;
    const saved = await commit(
      () => replyProjectDiscussion(projectId, threadId, message),
      { action: 'reply.created', threadId },
    );
    if (saved) setReplyDrafts((current) => ({ ...current, [threadId]: '' }));
  }

  async function handleStatus(thread) {
    const nextStatus = thread.status === 'resolved' ? 'open' : 'resolved';
    await commit(
      () => updateProjectDiscussionStatus(projectId, thread.id, nextStatus),
      { action: 'thread.status', threadId: thread.id },
    );
  }

  async function handleAccept(threadId, replyId) {
    await commit(
      () => acceptProjectDiscussionReply(projectId, threadId, replyId),
      { action: 'reply.accepted', threadId, replyId },
    );
  }

  return (
    <section className="project-discussion" aria-labelledby="project-discussion-title">
      <header className="project-discussion__header">
        <div>
          <span className="project-discussion__eyebrow">FORUM KOMUNITAS</span>
          <h2 id="project-discussion-title">Diskusi Proyek</h2>
          <p>Tanyakan pengembangan, modifikasi, atau kolaborasi terkait proyek ini.</p>
        </div>
        <div className="project-discussion__header-actions">
          <span className={`project-discussion__live is-${connection}`}>
            <i aria-hidden="true" />
            {connection === 'connected' ? 'Realtime aktif' : connection === 'connecting' ? 'Menghubungkan' : 'Pembaruan manual'}
          </span>
          {isLoggedIn ? (
            <button type="button" onClick={() => setShowForm((value) => !value)}>
              {showForm ? 'Tutup Form' : 'Mulai Diskusi'}
            </button>
          ) : (
            <a href="/signin">Login untuk berdiskusi</a>
          )}
        </div>
      </header>

      <div className="project-discussion__summary">
        <span><strong>{data.total || 0}</strong> topik</span>
        <span><strong>{data.openCount || 0}</strong> masih terbuka</span>
      </div>

      {showForm ? (
        <form className="project-discussion__new-form" onSubmit={handleCreate}>
          <label>
            Kategori
            <select value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}>
              {CATEGORIES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
            Judul diskusi
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Contoh: Bagaimana menambahkan sensor kedua?"
              minLength={5}
              maxLength={120}
              required
            />
          </label>
          <label className="project-discussion__wide-field">
            Jelaskan kebutuhan Anda
            <textarea
              value={draft.message}
              onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))}
              placeholder="Tuliskan konteks, komponen yang digunakan, dan hasil yang ingin dicapai."
              minLength={10}
              maxLength={3000}
              required
            />
          </label>
          <div className="project-discussion__form-footer">
            <small>{draft.message.length}/3000 karakter</small>
            <button type="submit" disabled={submitting}>{submitting ? 'Mengirim...' : 'Kirim Topik'}</button>
          </div>
        </form>
      ) : null}

      <div className="project-discussion__filters">
        <label className="project-discussion__search">
          <span className="sr-only">Cari diskusi</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari topik diskusi..." />
        </label>
        <select aria-label="Filter kategori" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Semua kategori</option>
          {CATEGORIES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
        <select aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">Semua status</option>
          <option value="open">Terbuka</option>
          <option value="resolved">Selesai</option>
        </select>
      </div>

      {error ? <div className="project-discussion__error" role="alert">{error}</div> : null}
      {loading ? <p className="project-discussion__empty">Memuat diskusi...</p> : null}
      {!loading && visibleThreads.length === 0 ? (
        <p className="project-discussion__empty">Belum ada diskusi yang sesuai. Mulai topik pertama untuk proyek ini.</p>
      ) : null}

      <div className="project-discussion__threads">
        {visibleThreads.map((thread) => {
          const isExpanded = Boolean(expanded[thread.id]);
          return (
            <article className="project-discussion__thread" key={thread.id}>
              <button
                type="button"
                className="project-discussion__thread-toggle"
                onClick={() => setExpanded((current) => ({ ...current, [thread.id]: !isExpanded }))}
                aria-expanded={isExpanded}
              >
                <span className="project-discussion__thread-main">
                  <span className="project-discussion__tags">
                    <span>{categoryLabel(thread.category)}</span>
                    <span className={`is-${thread.status}`}>{thread.status === 'resolved' ? 'Selesai' : 'Terbuka'}</span>
                  </span>
                  <strong>{thread.title}</strong>
                  <small>{thread.authorName} · {formatDate(thread.updatedAt)}</small>
                </span>
                <span className="project-discussion__thread-count">{thread.replyCount} balasan <b aria-hidden="true">{isExpanded ? '−' : '+'}</b></span>
              </button>

              {isExpanded ? (
                <div className="project-discussion__thread-body">
                  <AuthorLine item={thread} />
                  <p>{thread.message}</p>
                  {thread.canManage ? (
                    <button type="button" className="project-discussion__text-action" onClick={() => handleStatus(thread)} disabled={submitting}>
                      {thread.status === 'resolved' ? 'Buka kembali diskusi' : 'Tandai selesai'}
                    </button>
                  ) : null}

                  <div className="project-discussion__replies">
                    {thread.replies.map((reply) => (
                      <div className={`project-discussion__reply${reply.isAccepted ? ' is-accepted' : ''}`} key={reply.replyId}>
                        <AuthorLine item={reply} />
                        <p>{reply.message}</p>
                        {reply.isAccepted ? <strong className="project-discussion__accepted">Jawaban diterima</strong> : null}
                        {thread.canAcceptReply && !reply.isAccepted ? (
                          <button type="button" className="project-discussion__text-action" onClick={() => handleAccept(thread.id, reply.replyId)} disabled={submitting}>
                            Terima jawaban ini
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {isLoggedIn ? (
                    <form className="project-discussion__reply-form" onSubmit={(event) => handleReply(event, thread.id)}>
                      <textarea
                        value={replyDrafts[thread.id] || ''}
                        onChange={(event) => setReplyDrafts((current) => ({ ...current, [thread.id]: event.target.value }))}
                        placeholder="Tulis balasan atau tawarkan solusi..."
                        minLength={2}
                        maxLength={3000}
                        required
                      />
                      <button type="submit" disabled={submitting}>Kirim Balasan</button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {pageCount > 1 ? (
        <nav className="project-discussion__pagination" aria-label="Pagination diskusi proyek">
          <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</button>
          <span>Halaman {page} dari {pageCount}</span>
          <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Berikutnya</button>
        </nav>
      ) : null}
    </section>
  );
}
