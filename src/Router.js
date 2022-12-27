import {
  createBrowserRouter,
  Form,
  RouterProvider,
} from "react-router-dom";
import Menu from './Components/Menu.js'
import App from './App.js'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
]);

export default router;