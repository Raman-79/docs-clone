import { useCallback, useEffect, useState } from 'react';
import Quill, { TextChangeHandler } from 'quill';
import 'quill/dist/quill.snow.css';
import { useParams } from 'react-router-dom';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import './TextEditor.css';
const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ align: [] }],
  ['image', 'blockquote', 'code-block'],
  ['clean'],
] as any;

const WebSocketURL = "ws://localhost:3001";

const TextEditor = () => {
  const { id: documentId } = useParams<{ id: string }>();
  const [quill, setQuill] = useState<Quill | null>(null);
  const [getDocumentSent, setGetDocumentSent] = useState(false);
  const { sendMessage, lastMessage} = useWebSocket(WebSocketURL);
  useEffect(() => {
    if (!getDocumentSent) {
      sendMessage(JSON.stringify({ type: "get-document", payload: { docId: documentId } }));
      setGetDocumentSent(true);
    }
  }, [documentId, sendMessage, getDocumentSent]);

  useEffect(() => {
    if (!quill || !lastMessage) return;

    const message = JSON.parse(lastMessage.data);

    if (message.type === 'receive-changes') {
      quill.updateContents(message.payload);
    }
    else if (message.type === 'load-document'){
      quill.setContents(message.payload);
    }
  }, [quill, lastMessage]);

  useEffect(() => {
    if (!quill) return;

    const interval = setInterval(() => {
      const data = {
        type: "save-document",
        payload: {
          docId : documentId,
          data : quill.getContents()
        },
      };

      sendMessage(JSON.stringify(data));
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [quill, sendMessage]);

  useEffect(() => {
    if (!quill) return;
    const handler = function handle(delta:any,oldDelta:any,source:any){
      if (source !== "user") return;
      const data = {
        type: "send-changes",
        payload: {
          docId:documentId,
          data:delta
        }
      };
      sendMessage(JSON.stringify(data));
    }
    quill.on('text-change',handler);
    return ()=>{
      quill.off('text-change',handler);
    }
  }, [sendMessage, quill]);

  const wrapperRef = useCallback((wrapper: any) => {
    if (wrapper == null) return;
    wrapper.innerHTML = '';
    const editor = document.createElement('div');
    wrapper.append(editor);
    const q = new Quill(editor, { theme: 'snow', modules: { toolbar: TOOLBAR_OPTIONS } });
    setQuill(q);
  }, []);

  return <div className="container" ref={wrapperRef}></div>;
};

export default TextEditor;
