// src/app/login/page.tsx
import React from 'react';
import styled from 'styled-components';

const page = () => {
  return (
    <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
    }}>
        <span style={text}>hello</span>
    </div>
  );
};

export default page;

const text = {
    color: 'red',
    fontSize: '20px'
};