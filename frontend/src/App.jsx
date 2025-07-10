import { useState } from 'react'
import DisplayProducts from './components/displayProducts'
import Home from './pages/Home';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";


function App() {
  const [count, setCount] = useState(0)

  return (
    <>

    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home></Home>}></Route>
        <Route path='/DisplayProducts' element={ <DisplayProducts/> }></Route>
      </Routes>
    </BrowserRouter>

      {/* < DisplayProducts /> */}
    </>
  )
}

export default App;
