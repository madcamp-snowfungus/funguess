// components/Header.tsx
'use client'

import styled from 'styled-components'

export default function Header() {
  return (
    <HeaderContainer>
      <Logo>FunGuess</Logo>
    </HeaderContainer>
  )
}

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Logo = styled.h1`
  font-size: 24px;
  font-weight: bold;
`