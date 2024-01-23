import TextEditor from './TextEditor';
import {
   BrowserRouter,
   Switch,
   Route,
   Redirect
 } from "react-router-dom";
 import { v4 as uuidV4 } from 'uuid';
import './App.css'
function App() {
   return (
      <BrowserRouter>
          <Switch>
        <Route exact path="/">
          <Redirect to ={`/doc/${uuidV4()}`} />
        </Route>
        <Route path="/doc/:id">
          <TextEditor />
        </Route>
      </Switch>
      </BrowserRouter>
   )
}

export default App
