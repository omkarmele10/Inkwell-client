import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { api, errorMessage } from '../api';
import { useMe } from '../hooks';
import { ImageIcon } from '../components/icons.jsx';

const TAG_RE = /^[a-z0-9_]{2,30}$/;

export default function EditorPage() {
  const { id: articleId } = useParams();          // present when editing
  const { data: me, isLoading: meLoading } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const articleBodyRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  const existingArticleQuery = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => api.get(`/articles/${articleId}`).then((response) => response.data),
    enabled: !!articleId,
  });
  useEffect(() => {
    const article = existingArticleQuery.data;
    if (!article) return;
    setTitle(article.title);
    setContent(article.content);
    setCoverImageUrl(article.coverImageUrl);
    setHashtags(article.hashtags);
  }, [existingArticleQuery.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveArticle = useMutation({
    mutationFn: (status) => {
      const articleRequest = { title: title.trim(), content, coverImageUrl, hashtags, status };
      return (articleId ? api.put(`/articles/${articleId}`, articleRequest) : api.post('/articles', articleRequest))
        .then((response) => response.data);
    },
    onSuccess: (savedArticle) => {
      queryClient.setQueryData(['article', savedArticle.id], savedArticle);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['hashtags'] });
      navigate(`/article/${savedArticle.id}`);
    },
    onError: (requestError) => setError(errorMessage(requestError)),
  });
  const deleteArticle = useMutation({
    mutationFn: () => api.delete(`/articles/${articleId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['feed'] }); navigate('/'); },
  });
  const uploadImage = useMutation({
    mutationFn: (imageFile) => {
      const form = new FormData();
      form.append('file', imageFile);
      return api.post('/uploads', form).then((response) => response.data.url);
    },
    onError: (requestError) => setError(errorMessage(requestError)),
  });

  if (meLoading) return null;
  if (!me) return <Navigate to="/login" replace />;
  if (existingArticleQuery.data && existingArticleQuery.data.author.id !== me.id) {
    return <p className="empty">You can only edit your own articles.</p>;
  }

  const addHashtag = () => {
    const hashtag = hashtagInput.trim().replace(/^#/, '').toLowerCase();
    if (!hashtag) return;
    if (!TAG_RE.test(hashtag)) return setError('Hashtags use letters, numbers and underscores (2–30 characters).');
    if (hashtags.length >= 5) return ;
    setError('');
    if (!hashtags.includes(hashtag)) setHashtags([...hashtags, hashtag]);
    setHashtagInput('');
  };

  const insertImage = async (imageFile) => {
    if (!imageFile) return;
    setError('');
    const imageUrl = await uploadImage.mutateAsync(imageFile).catch(() => null);
    if (!imageUrl) return;
    const articleBodyElement = articleBodyRef.current;
    const selectionPosition = articleBodyElement ? articleBodyElement.selectionStart : content.length;
    setContent(`${content.slice(0, selectionPosition)}\n\n![describe this image](${imageUrl})\n\n${content.slice(selectionPosition)}`);
  };
  const uploadCoverImage = async (imageFile) => {
    if (!imageFile) return;
    setError('');
    const imageUrl = await uploadImage.mutateAsync(imageFile).catch(() => null);
    if (imageUrl) setCoverImageUrl(imageUrl);
  };

  const valid = title.trim() && content.trim();
  const isSavingOrUploading = saveArticle.isPending || uploadImage.isPending;
  const isPublished = existingArticleQuery.data?.status === 'PUBLISHED';

  return (
    <div className="editor">
      <div className="editor-actions">
        <span className="muted">{articleId ? 'Editing' : 'New article'}</span>
        <div className="spacer" />
        <button className="btn" disabled={!valid || isSavingOrUploading} onClick={() => saveArticle.mutate('DRAFT')}>Save draft</button>
        <button className="btn btn-accent" disabled={!valid || isSavingOrUploading} onClick={() => saveArticle.mutate('PUBLISHED')}>{isPublished ? 'Update' : 'Publish'}</button>
      </div>

      <input className="title-input" aria-label="Title" placeholder="Title" maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} />

      <div className="tag-input">
        {hashtags.map((hashtag) => <button key={hashtag} className="chip-tint" aria-label={`Remove hashtag ${hashtag}`} onClick={() => setHashtags(hashtags.filter((existingHashtag) => existingHashtag !== hashtag))}>#{hashtag} ×</button>)}
        <input aria-label="Add hashtag" placeholder="+ add hashtag" value={hashtagInput}
          onChange={(event) => setHashtagInput(event.target.value)}
          onKeyDown={(keyboardEvent) => { if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ',') { keyboardEvent.preventDefault(); addHashtag(); } }}
          onBlur={addHashtag} />
         <p className="tag-warning">
           You can add up to 5 hashtags.
         </p>
      </div>

      <div className="dropzone">
        {coverImageUrl ? <img src={coverImageUrl} alt="Cover" /> : <ImageIcon />}
        <div>
          <b>{coverImageUrl ? 'Cover image' : 'Add a cover image'}</b>
          <div className="muted">JPEG, PNG, GIF or WebP, up to 5 MB</div>
          <label className="link-btn" style={{ cursor: 'pointer' }}>
            {coverImageUrl ? 'Replace' : 'Choose file'}
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={(event) => uploadCoverImage(event.target.files[0])} />
          </label>
          {coverImageUrl && <button className="link-btn" style={{ marginLeft: 16 }} onClick={() => setCoverImageUrl(null)}>Remove</button>}
        </div>
      </div>

      <div className="toolbar">
        <label className="link-btn" style={{ cursor: 'pointer', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <ImageIcon /> Insert image
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={(event) => { insertImage(event.target.files[0]); event.target.value = ''; }} />
        </label>
        <span className="muted">Markdown supported</span>
        <div className="spacer" />
        <button className="link-btn" onClick={() => setPreview((showPreview) => !showPreview)}>{preview ? 'Edit' : 'Preview'}</button>
      </div>

      {preview ? (
        <div className="prose"><ReactMarkdown>{content || '*Nothing to preview yet.*'}</ReactMarkdown></div>
      ) : (
        <textarea ref={articleBodyRef} className="body-input" aria-label="Article body" placeholder="Tell your story…" maxLength={50000} value={content} onChange={(event) => setContent(event.target.value)} />
      )}

      {uploadImage.isPending && <p className="muted">Uploading image…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <p className="muted">An AI summary is generated automatically after you publish.</p>
      {articleId && <button className="btn btn-danger btn-sm" onClick={() => window.confirm('Delete this article permanently?') && deleteArticle.mutate()}>Delete article</button>}
    </div>
  );
}
