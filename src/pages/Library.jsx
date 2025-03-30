import React, { useState } from 'react';

const Library = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch('http://192.168.43.254:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('File uploaded successfully!');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error uploading file');
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleUpload} className="flex flex-col gap-3">
        <label className="font-bold">Upload Audio File</label>
        <input type="file" onChange={handleFileChange} className="border p-2" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Upload
        </button>
      </form>
      {message && <p className="mt-3 text-red-500">{message}</p>}
    </div>
  );
};

export default Library;
