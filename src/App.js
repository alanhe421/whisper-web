import React from 'react';
import Upload from './components/Upload';
import Setting from './components/Setting';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App min-h-screen pb-16 relative">
      <Setting />
      <Upload />
      <Footer />
    </div>
  );
}

export default App;
