// Import React and necessary components
import  { useState } from 'react';
import './App.css'; // Import the CSS file for styling

const Register = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
   name: ''
  });

  // Handle form input changes
  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit =  async () => {
    const response = await fetch('YOUR_BACKEND_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData.name),
    });
  
    if (!response.ok) {
      // handle server errors or bad responses
      throw new Error('Network response was not ok');
    }
  
    return response.json();
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="name"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          required
          autoComplete='off'
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
