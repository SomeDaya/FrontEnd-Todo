import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('Todos')
      .select('*')
      .order('id', { ascending: true });
    if (!error) setTodos(data);
  };

  useEffect(() => {
    if (session) fetchTodos();
  }, [session]);

  const addTodo = async () => {
    if (newTodo.length === 0) return;
    const { error } = await supabase
      .from('Todos')
      .insert([{ title: newTodo, user_id: session.user.id }]); // ผูกกับ ID ของบอย
    if (!error) {
      setNewTodo('');
      fetchTodos();
    }
  };

  const deleteTodo = async (id) => {
    const { error } = await supabase.from('Todos').delete().eq('id', id);
    if (!error) fetchTodos();
  };

  const toggleTodo = async (id, is_completed) => {
    const { error } = await supabase
      .from('Todos')
      .update({ is_completed: !is_completed })
      .eq('id', id);
    if (!error) fetchTodos();
  };

  if (!session) {
    return (
      <div style={{minHeight: "100vh", 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F9C8CE"
      }}>
      <main className="container" style={{ maxWidth: '600px', marginTop: '-5vh'}}>
        <article style={{background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" , borderRadius: "15px" , border: "1px solid rgba(255, 255, 255, 0.3)" , boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)"}}>
          <header style={{backgroundColor: "transparent", boxShadow: "none", border: "none"}}><h2 style={{ textAlign: 'center' ,marginTop: "2vh" , marginBottom: "-2vh" ,color : "rgb(244, 44, 111)"}}>Login</h2></header> 
          <form onSubmit={(e) => {
            e.preventDefault();
            supabase.auth.signInWithPassword({ email, password }).then(({ error }) => {
              if (error) setMessage('❌ ' + error.message);
            });
          }}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Login</button>
            <button type="button" className="outline"  onClick={() => {
              supabase.auth.signUp({ email, password }).then(({ error }) => {
                if (error) setMessage('❌ ' + error.message);
                else setMessage('✅ สมัครสำเร็จ! เช็คเมลหรือล็อกอินได้เลย');
              });
            }}>register</button>
          </form>
          <footer style={{ textAlign: 'center' , backgroundColor: "transparent", boxShadow: "none", border: "none" , marginTop: "-1vh" , marginBottom: "-1vh" }}>{message}</footer>
        </article>
      </main>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F9C8CE" , minHeight: "100vh" , display : "flex"}}>
    <main className="container" style={{ maxWidth: '600px', marginTop: '40px' }}>
      <nav>
        <ul><li><strong class="forbox">🚀 Todo for {session.user.email}</strong></li></ul>
        <ul><li><button className="outline contrast" onClick={() => supabase.auth.signOut()}>Exit</button></li></ul>
      </nav>
      <article class="headerup">
        <fieldset role="group">
          <input type="text" class="forup" placeholder="มีอะไรต้องทำไหมบอย?" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
          <button  class="button2 forup" onClick={addTodo}>เพิ่ม</button>
        </fieldset>
        {todos.map((todo) => (
          <div key={todo.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0px' , borderBottom: 'px solid #eee' }}>
            <span onClick={() => toggleTodo(todo.id, todo.is_completed)} style={{ textDecoration: todo.is_completed ? 'line-through' : 'none', cursor: 'pointer', flex: 1 }}>
              {todo.title}
            </span>
            <button class="delete1" onClick={() => deleteTodo(todo.id)} style={{ width: 'auto', padding: '2px 10px' }}>Delete</button>
          </div>
        ))}
      </article>
    </main>
    </div>
  );
}

export default App;