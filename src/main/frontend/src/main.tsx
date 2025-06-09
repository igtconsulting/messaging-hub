import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.scss";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.tsx";
import Connections from "./pages/Connections/Connections.tsx";
import Topics from "./pages/Topics/Topics.tsx";
import Interfaces from "./pages/Interfaces/Interfaces.tsx";
import NewConnection from "./pages/Connections/NewConnection.tsx";
import ConnectionDetail from "./pages/Connections/ConnectionDetail.tsx";
import EditConnection from "./pages/Connections/EditConnection.tsx";
import AlertContext from "./contextapi/AlertContext.tsx";
import TopicDetail from "./pages/Topics/TopicDetail.tsx";
import InterfaceDetail from "./pages/Interfaces/InterfaceDetail.tsx";
import NewInterface from "./pages/Interfaces/NewInterface.tsx";
import CreateTopic from "./pages/Topics/CreateTopic.tsx";
import EditTopic from "./pages/Topics/EditTopic.tsx";
import EditInterface from "./pages/Interfaces/EditInterface.tsx";
import Help from "./pages/Help.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AlertContext>
      <BrowserRouter basename="/MessagingHub">
        <Routes>
          <Route path="/" element={<App />}>
            <Route index element={<Dashboard />} />
            <Route path="connections">
              <Route index element={<Connections />} />
              <Route path="new" element={<NewConnection />} />
              <Route path=":name/detail" element={<ConnectionDetail />} />
              <Route path=":name/edit" element={<EditConnection />} />
            </Route>
            <Route path="topics">
              <Route index element={<Topics />} />
              <Route path="new" element={<CreateTopic />} />
              <Route path=":connection/:name/detail" element={<TopicDetail />} />
              <Route path=":connection/:name/edit" element={<EditTopic />} />
            </Route>
            <Route path="interfaces">
              <Route index element={<Interfaces />} />
              <Route path="new" element={<NewInterface />} />
              <Route path=":name/detail" element={<InterfaceDetail />} />
              <Route path=":name/edit" element={<EditInterface />} />
            </Route>
            <Route path="help" element={<Help />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AlertContext>
  </React.StrictMode>
);
