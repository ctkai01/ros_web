import React, { useState, useEffect } from 'react';
import './Login.css';
import serverConfig from '../config/serverConfig';
import logo from '../assets/icons/logo.jpg';

const Login = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeDisplay, setPincodeDisplay] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePincodeInput = (digit) => {
    const currentIndex = pincodeDisplay.findIndex(char => char === '');
    if (currentIndex !== -1) {
      const newDisplay = [...pincodeDisplay];
      newDisplay[currentIndex] = digit;
      setPincodeDisplay(newDisplay);
      setPincode(newDisplay.join(''));
    }
  };

  const handlePincodeClear = () => {
    setPincodeDisplay(['', '', '', '']);
    setPincode('');
  };

  const handleKeyDown = (e) => {
    // Prevent Enter key from submitting form and refreshing page
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      // On mobile, blur the input to hide virtual keyboard
      if (e.target && typeof e.target.blur === 'function') {
        e.target.blur();
      }
    }
  };

  const handlePincodeBackspace = () => {
    const lastFilledIndex = pincodeDisplay.map((char, index) => char !== '' ? index : -1).filter(index => index !== -1).pop();
    if (lastFilledIndex !== undefined) {
      const newDisplay = [...pincodeDisplay];
      newDisplay[lastFilledIndex] = '';
      setPincodeDisplay(newDisplay);
      setPincode(newDisplay.join(''));
    }
  };

  // Auto-submit when PIN code is complete (4 digits)
  useEffect(() => {
    if (activeTab === 'pincode' && pincodeDisplay.every(char => char !== '') && pincode.length === 4) {
      handleSubmit(new Event('submit'));
    }
  }, [pincodeDisplay, activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Logging in to:', serverConfig.LOGIN_URL);
      const response = await fetch(serverConfig.LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          pincode,
          loginType: activeTab
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.accessToken) {
        throw new Error('No access token received');
      }


      // Store authentication data
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userName', data.user.username);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userGroup', data.user.group_name);
      localStorage.setItem('userGroupLevel', data.user.group_level);


      onLogin({
        serverUrl: serverConfig.SERVER_URL,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user
      });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">

          <div className="login-tabs">
            <div className="login-logo">
              <img
                src={logo}
                alt="Data Design Engineering"
                style={{ paddingBottom: '10px' }}
              />
            </div>
            <div className="login-tabs-content">
              <p className="login-tabs-info">Please choose a way to login</p>
              <div className="login-tabs-buttons">
                <button
                  className={activeTab === 'credentials' ? 'active' : ''}
                  onClick={() => setActiveTab('credentials')}
                >
                  Username and password
                </button>
                <button
                  className={activeTab === 'pincode' ? 'active' : ''}
                  onClick={() => setActiveTab('pincode')}
                >
                  PIN code
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'credentials' ? (
          <div className="login-content">
            <div className="login-instructions">
              <h2>Log in by username and password</h2>
              <p className="login-info">
                Enter your username and password to log in to the robot. <br /> <br />
                Your username and password should be given to you by either the robot administrator or found in the robot manual. <br /> <br />
                If you don't have a username and password, please contact the robot administrator. <br /> <br />
                If you have forgotten your password, please contact the robot administrator.
              </p>
            </div>

            <div className="login-form">
              <form onSubmit={handleSubmit}>
                <div className="form-group-container">
                  <span className="form-group-label"> Username: </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username..."
                    className="form-group-input"
                    required
                    onKeyDown={handleKeyDown}
                  />
                </div>
                <div className="form-group-container">
                  <span className="form-group-label"> Password: </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password..."
                    className="form-group-input"
                    required
                    onKeyDown={handleKeyDown}
                  />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit" className="login-button" disabled={isLoading}>
                  <img src="assets/icons/key.png" alt="" className="key-icon" />
                  {isLoading ? 'Logging in...' : 'Log in'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="login-content">
            <div className="login-instructions">
              <h2>Log in by PIN code</h2>
              <p className="login-info">
                If you are registered in the robot as a PIN code-enabled user, you can use your PIN code to log in to the robot.
              </p>
              <p className="login-info">
                If you are not registered in the robot as a PIN code-enabled user, please contact the robot administrator.
              </p>


              <div className="login-form">
                <form onSubmit={handleSubmit}>
                  <div className="login-pincode-input-container">
                    <div className="form-group-pincode">
                      <input
                        type="password"
                        value={pincodeDisplay[0]}
                        readOnly
                        className="pincode-display"
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                    <div className="form-group-pincode">
                      <input
                        type="password"
                        value={pincodeDisplay[1]}
                        readOnly
                        className="pincode-display"
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                    <div className="form-group-pincode">
                      <input
                        type="password"
                        value={pincodeDisplay[2]}
                        readOnly
                        className="pincode-display"
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                    <div className="form-group-pincode">
                      <input
                        type="password"
                        value={pincodeDisplay[3]}
                        readOnly
                        className="pincode-display"
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                  </div>
                  {error && <div className="error-message">{error}</div>}
                </form>
              </div>
            </div>
            <div className="login-pincode-button-container">
              <div className="numeric-keypad">
                <div className="keypad-row">
                  <button
                    type="button"
                    className="keypad-button numeric"
                    onClick={() => handlePincodeInput('1')}
                    onKeyDown={handleKeyDown}
                  >
                    1
                  </button>
                  <button
                    type="button"
                    className="keypad-button numeric"
                    onClick={() => handlePincodeInput('2')}
                    onKeyDown={handleKeyDown}
                  >
                    2
                  </button>
                  <button
                    type="button"
                    className="keypad-button numeric"
                    onClick={() => handlePincodeInput('3')}
                    onKeyDown={handleKeyDown}
                  >
                    3
                  </button>
                </div>
                <div className="keypad-row">
                  <button
                    type="button"
                    className="keypad-button numeric"
                    onClick={() => handlePincodeInput('4')}
                    onKeyDown={handleKeyDown}
                  >
                    4
                  </button>
                  <button
                    type="button"
                    className="keypad-button numeric"
                    onClick={() => handlePincodeInput('5')}
                    onKeyDown={handleKeyDown}
                  >
                    5
                  </button>
                  <button
                    type="button"
                    className="keypad-button numeric"
                    onClick={() => handlePincodeInput('6')}
                    onKeyDown={handleKeyDown}
                  >
                    6
                  </button>
                </div>
                <div className="keypad-row">
                  <button
                    type="button"
                    className="keypad-button numeric"
                    onClick={() => handlePincodeInput('7')}
                    onKeyDown={handleKeyDown}
                  >
                    7
                  </button>
                  <button
                    type="button"
                    className="keypad-button numeric"
                    onClick={() => handlePincodeInput('8')}
                    onKeyDown={handleKeyDown}
                  >
                    8
                  </button>
                  <button
                    type="button"
                    className="keypad-button numeric"
                    onClick={() => handlePincodeInput('9')}
                    onKeyDown={handleKeyDown}
                  >
                    9
                  </button>
                </div>
                <div className="keypad-row">
                  <button
                    type="button"
                    className="keypad-button numeric zero"
                    onClick={() => handlePincodeInput('0')}
                    onKeyDown={handleKeyDown}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    className="keypad-button action"
                    onClick={handlePincodeBackspace}
                    onKeyDown={handleKeyDown}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 