/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeView from './views/HomeView';
import DetailView from './views/DetailView';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/note/:id" element={<DetailView />} />
      </Routes>
    </Router>
  );
}
