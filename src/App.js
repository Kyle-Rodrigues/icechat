import './Chatroom.css';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

import { useAuthState } from 'react-firebase-hooks/auth'
import { useCollectionData } from 'react-firebase-hooks/firestore'
import { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Link, Route, RouterProvider, createBrowserRouter, json } from "react-router-dom";
import Menu from './Components/Menu';

firebase.initializeApp({
  apiKey: "AIzaSyBWGPxYhMnb7xRBXfN9t4cdCGu_oyzZzEQ",
  authDomain: "ice-chat-dec4a.firebaseapp.com",
  projectId: "ice-chat-dec4a",
  storageBucket: "ice-chat-dec4a.appspot.com",
  messagingSenderId: "9041475051",
  appId: "1:9041475051:web:d40f0c63c2f8bb1cb095ae",
  measurementId: "G-XRZSP767C9"
})
const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </div>
  );
}
function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }
  return (
    <button onClick={signInWithGoogle}> Sign in with google</button>
  )
}
function SignOut() {
  return auth.currentUser && (
    <button className={"sign-out"} onClick={() => { auth.signOut() }}>Sign out</button>
  )
}
function ChatRoom() {
  const banana = useRef()
  const messagesRef = firestore.collection('messages');
  const liveMessagesRef = firestore.collection('liveMessages')
  const query = messagesRef.orderBy('createdAt').limit(100);
  const { uid, photoURL } = auth.currentUser;

  const [messages] = useCollectionData(query, { idField: 'id' });
  const [liveMessages] = useCollectionData(liveMessagesRef.orderBy('createdAt').limit(50), { idField: 'id' });

  const [formValue, setFormValue] = useState('')
  

  useEffect(() => {
    const { uid, photoURL } = auth.currentUser;
    firestore.collection('liveMessages').doc(uid).set({
      text: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    })
    banana.current.scrollIntoView({ behavior: 'smooth' });
  }, [])
  useEffect(() => {
    banana.current.scrollIntoView({behavior: 'smooth'})
  }, [liveMessages])

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL, } = auth.currentUser;
    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    });
    setFormValue('')
    const userMessage = firestore.collection('liveMessages').doc(uid);
    userMessage.update({
      text: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    })
    banana.current.scrollIntoView({ behavior: 'smooth' });
  }

  const updateMessage = async (e) => {
    e.preventDefault();
    setFormValue(e.target.value)
    const userMessage = firestore.collection('liveMessages').doc(uid);
    userMessage.update({
      text: e.target.value,
      uid,
      photoURL
    })
    //Add empty string to scroll down to the bottom
    await messagesRef.add({
      text: '',
      uid,
      photoURL
    });
    banana.current.scrollIntoView({ behavior: 'smooth' });
    //Delete all the empty strings
    var queryForEmpty = firestore.collection('messages').where('text', '==', '');
    queryForEmpty.get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        doc.ref.delete();
      });
    });

  }
  const restartMessage = () => {
    setFormValue('')
    const userMessage = firestore.collection('liveMessages').doc(uid);
    userMessage.update({
      text: '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    })
  }
  const ChatMessage = (props) => {
    const { text, uid, photoURL, createdAt } = props.message
    //Bull shit to get the date and time of text into a javascript date object
    const createdAtObj = JSON.stringify(createdAt)
    const split = createdAtObj.split(',')
    const split2 = split[0].split(':')
    const seconds = parseInt(split2[1])
    let dateObj = new Date(seconds * 1000)
    let hours = dateObj.getHours()
    let ampm = 'am'
    if (hours > 12) {
      hours = hours - 12
      ampm = 'pm'
    }
    const time = hours + ":" + dateObj.getMinutes() + ampm

    const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
    //Don't show empty messages
    if (text == "") return
    return (
      <>
        <div className={`message ${messageClass}`}>
          <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
          <p>{text}</p>
          <span className='timesent'>{time}</span>
        </div>
      </>
    )
  }
  return (
    <>
      <header>
        <button onClick={() => banana.current.scrollIntoView({ behavior: 'smooth' })}>Scroll to bottom</button>
      </header>
      <main>
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        {liveMessages && liveMessages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        <span ref={banana} />
      </main>
      <SignOut />

      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={e => {
          updateMessage(e)
        }} />
        <button type='button' onClick={(e) => restartMessage()}>Refresh</button>
      </form>
    </>
  )
}

export default App;
