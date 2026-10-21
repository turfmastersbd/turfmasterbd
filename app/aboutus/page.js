import React from 'react'
import Turfs from '@/components/Turfs'
import Link from 'next/link'

const Aboutus = () => {
  return (
    <>
      <Turfs/>
      <div className='button-wrap'>
        <Link href='/booking'>
          <span className='secondary-button'>Book Now</span>
        </Link>
      </div>
    </>
  )
}

export default Aboutus