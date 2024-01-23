import { useCallback, useEffect, useState } from 'react';
import Quill, { TextChangeHandler } from 'quill';
import Delta from 'quill';
import 'quill/dist/quill.snow.css';
import { useParams } from 'react-router-dom';
import useWebSocket,{ReadyState} from 'react-use-websocket';
const SAVE_INTERVAL_MS = 2000
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
  const [socketUrl, setSocketUrl] = useState(WebSocketURL);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  //connect to socket
  useEffect(() => {
    if (!quill || !lastMessage) return;

    const message = JSON.parse(lastMessage.data);

    if (message.type === 'receive-changes') {
      quill.updateContents(message.payload);
    }
  }, [quill, lastMessage]);

  
  useEffect(() => {
    if (!quill) return;
    
    quill.on('text-change', function(delta,oldDelta,source){
      if (source !== "user") return;
      const data = {
        type: "send-changes", payload: delta
      }
      sendMessage(JSON.stringify(data));
    });
  }, [sendMessage, quill,lastMessage]);


  //Send doc changes
  // useEffect(() => {
  //   if (lastMessage == null || quill == null) return;

  //   const handler:TextChangeHandler = (delta, source:any) => {
  //     if (source !== "user") return;
  //     sendMessage(JSON.stringify({ type: "send-changes", payload: delta }));
  //   };

  //   quill.on("text-change", handler);

  //   return () => {
  //     quill.off("text-change", handler);
  //   };
  // }, [lastMessage, quill]);



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