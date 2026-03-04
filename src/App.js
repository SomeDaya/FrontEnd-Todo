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
  const [isRegistering , setIsRegistering] = useState(false)
  const [name , setName] = useState("")
  const [confirmPassword , setConfirmPassword] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState("")
  const [editDiscription, setEditDiscription] = useState("")
  const [viewingId , setViewingId] = useState(null)
  const [isProcessing , setIsProcessing] = useState(false)


   const handleSignUp = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("รหัสผ่านไม่ตรงกันเครฟฟฟ");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            display_name: name,
          }
        }
      });

      if(error) throw error;

      setMessage("🎉 สมัครสมาชิกสำเร็จ! Let's Gooooo");

      setName("");
      setPassword("");
      setConfirmPassword("");
      setIsRegistering(false);
      
    } catch (error) {
      setMessage("เอ๊ะ สมัครไม่ผ่าน" + error.message)
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch(`https://testsopabase.onrender.com/todos?user_id=${session.user.id}`);
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error("ดึงข้อมูลไม่สำเร็จ", error)
    }
  };

  useEffect(() => {
    if (session) fetchTodos();
  }, [session]);


  const addTodo = async () => {
    if (newTodo.length === 0) return;
    try {
      const response = await fetch("https://testsopabase.onrender.com/todos" , {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTodo,
          user_id: session.user.id
        })
      });

      if (response.ok) {
        setNewTodo("");
        fetchTodos();
      }
    } catch (error) {
      console.error("เพิ่มงานไม่สำเร็จ:", error );
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch (`https://testsopabase.onrender.com/todos/${id}`, {
        method: "DELETE",
      });
      if (response.ok) fetchTodos();
    } catch(error) {
      console.error("ลบงานไม่สำเร็จ:" , error );
    }
  };

  const toggleTodo = async (id, is_completed) => {
    if (isProcessing) return;

    setIsProcessing(true);

    setTodos(prevTodos => 
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, is_completed: !is_completed } : todo
      )
    )

    try {
      const response = await fetch (`https://testsopabase.onrender.com/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type" : "application/json"} ,
        body: JSON.stringify({ is_completed : !is_completed})
      })
      if (response.ok) { 
      fetchTodos();
      console.log("อัปเดตสถานะไม่สำเร็จ");
      }
    } catch(error) {
      fetchTodos();
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 200);
    }
  };

  const saveEdit = async (id) => {
    try {
      const response = await fetch(`https://testsopabase.onrender.com/todos/${id}` , {
        method: "PUT" ,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editText , discription: editDiscription})
      });
      if(response.ok) {
        setEditingId(null);
        setViewingId(null);
        fetchTodos();
      }
    } catch (error) {
      console.error("แก้ไขข้อความไม่สำเร็จ" , error);
    }
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
          {isRegistering ? (
            <>
          <header style={{backgroundColor: "transparent", boxShadow: "none", border: "none"}}><h2 style={{ textAlign: 'center' ,marginTop: "2vh" , marginBottom: "-2vh" ,color : "rgb(244, 44, 111)"}}>Login</h2></header> 
          <form onSubmit={handleSignUp}>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="text" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <input type="text" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <button type='submit'>register</button>
          </form>
          </>
          ) : (
            <>
          <header style={{backgroundColor: "transparent", boxShadow: "none", border: "none"}}>
                <h2 style={{ textAlign: 'center' ,marginTop: "2vh" , marginBottom: "-2vh" ,color : "rgb(244, 44, 111)"}}>Login</h2>
              </header> 
              <form onSubmit={(e) => {
                e.preventDefault();
                supabase.auth.signInWithPassword({ email, password }).then(({ error }) => {
                  if (error) setMessage('❌ ' + error.message);
                });
              }}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
                <button type="button" className="outline" onClick={() => setIsRegistering(true)}>Register</button>
              </form>
              </>
          )}
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
          <input type="text" className="forup" placeholder="มีอะไรต้องทำไหมบอย?" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
          <button  className="button2 forup" onClick={addTodo}>เพิ่ม</button>
        </fieldset>
        {todos.map((todo) => (
          <div key={todo.id} className="todo-row" style={{ display: 'flex', flexDirection: 'column', padding: '10px 0px' , borderBottom: '1px solid rgba(255,255,255,0.4)' }}>
         
          <div className='todo-main-controls' style={{ display: "flex" , justifyContent: "space-between", alignItems: "center" , flexWrap:"wrap", gap:"10px" , width: "100%"}}>
         
            {editingId === todo.id ? (
            <div style={{ display: "flex" , flexDirection: "column", flex: 1, gap: "10px"}}>
              <input 
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              style={{ margin: 0, padding: "5px"}}
              placeholder="ชื่อหัวข้องาน"
              />
              <textarea 
              value={editDiscription}
              onChange={(e) => setEditDiscription(e.target.value)}
              style={{ margin: 0, padding: "5px" , minHeight: "60px"}}
              placeholder="เพิ่มรายละเอียดงาน"
              />
              <div style={{ display: "flex" , flex: 1, gap: "10px"}}>
              <button onClick={() => saveEdit(todo.id)} style={{ padding: "2px 10px" , width: "auto", backgroundColo: "#4CAF50", border: "none"}}>Save</button>
              <button className="outline" onClick={() => {setEditingId(null); setViewingId(null);}} style={{ padding: "2px 10px" , width: "auto"}}>Cancel</button>
              </div>
            </div>
            ) : (
              <>
              <div className='todo-content' style={{ flex: "1 1 200px" , minWidth: "0" , paddingTop: "0px" , paddingBottom: "5px"}}>
                <span onClick={() => toggleTodo(todo.id, todo.is_completed)} style={{ textDecoration: todo.is_completed ? "line-through" : "none", cursor: "pointer",  wordBreak: "break-word" , display: "block" , fontSize: "1.1rem"}}>
                  {todo.title}
                </span>
              </div>
                <div className = "todo-actions botton-group-for-mobile" style ={{ display: "flex", gap: "5px" , flexWrap: "nowrap" , alignItems:"center" , flex: "0 0 auto"}}>
                  <button
                  className='outline'
                  onClick={() => setViewingId(viewingId === todo.id ? null : todo.id)}
                  style={{ padding: '5px 10px', width: "auto", borderColor: "#00bcd4", color: "#00bced4" , fontSize: "18px"}}
                  >
                    {viewingId === todo.id ? "Hide" : "Details"}
                  </button>
                  <button 
                  className="outline-custom"
                  onClick={() => {
                    setEditingId(todo.id);
                    setEditText(todo.title)
                    setEditDiscription(todo.discription || "");
                    setViewingId(null);
                  }}
                  style={{ padding: "5px 10px", width: "auto", borderColor: "#ffc107" ,  fontSize: "18px"}}>
                    Edit
                  </button>
                  <button class="delete1" onClick={() => deleteTodo(todo.id)} style={{ width: "auto" , padding: "5px 10px" , fontSize: "18px"}}>Delete</button>
                </div>
              </>
            )}
            </div>
          
          {viewingId === todo.id && editingId !== todo.id && (
            <div style={{ marginTop: "10px" , padding: "10px" , backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "5px", fontSize: "0.9em" , color:"#333"}}>
              {todo.discription ? todo.discription : "ยังไม่มีรายละเอียดงาน ลอง edit ดูสิ"}
            </div>
          )}
           </div>
        ))}
      </article>
    </main>
    </div>
  );
}

export default App;