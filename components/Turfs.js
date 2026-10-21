import React from 'react'
import Image from 'next/image'
import Turf from '@/public/images/turfimage.webp'
import Link from 'next/link'

const Turfs = () => {
    return (
        <>
            <section className='our-turfs'>
                <div className="container">
                    <h2 className='primary-heading our-turfs__heading'>Our Turfs</h2>
                    <p className='our-turfs__text'>A good turf makes every game smoother and every player better. Step in, feel the field, and own the match</p>
                    <div className="our-turfs__content">
                        <Link href='/' className='our-turfs__wrapper'>
                            <div className="our-turfs__turf-wrap">
                                <div className='our-turfs__turf-image-wrap'>
                                    <Image
                                        src={Turf}
                                        alt=''
                                        className='our-turfs__turf-image'
                                        width={600}
                                    />
                                    <span className='our-turfs__image-title'>Turf Masters BD</span>
                                </div>
                                <h3 className='our-turfs__turf-name'>Turf Masters BD</h3>
                                <p className='our-turfs__turf-text'>The Home of Football in Uttara</p>
                            </div>
                        </Link>

                    </div>
                </div>
            </section>
        </>
    )
}

export default Turfs