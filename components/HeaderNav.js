import React from 'react'
import Link from 'next/link'

const HeaderNav = ({menuDataAtt}) => {
  return (
    <>
        {
            menuDataAtt.map((currElem) => {
                return (
                    <Link href={currElem.menuUrl} key={currElem.id}>
                        <span className="header__nav-item">{currElem.menuText}</span>
                    </Link>
                )
            })
        }
        
    </>
  )
}

export default HeaderNav