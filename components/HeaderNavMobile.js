import React, { useState, useRef } from 'react'
import Link from 'next/link'



const HeaderNavMobile = ({menuDataMobile}) => {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const headerRef = useRef(null);

  return (
    <>
        {
            menuDataMobile.map((currElem) => {
                return (
                    <Link href={currElem.menuUrl} key={currElem.id} ref={headerRef}>
                      <span className="header__nav-item" onClick={toggleMenu}>{currElem.menuText}</span>
                    </Link>
                )
            })
        }
        
    </>
  )
}

export default HeaderNavMobile