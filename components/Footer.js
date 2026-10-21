import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import mainLogo from '@/public/images/main-logo.png'

const Footer = () => {
    return (
        <>
            <footer className="footer">
                <div className="container">
                    <div className="footer__content">
                        <div className="footer__column">
                            <div className='footer__logo-wrap'>
                                <Link href='/' className='footer__logo-link'>
                                    <Image
                                        src={mainLogo}
                                        alt='Footer Turf Masters BD Logo'
                                        width={1000}
                                        className='footer__logo'
                                    />
                                </Link>
                            </div>
                            <div className='footer__description-wrap'>
                                <p className='footer__description-text'>
                                    Turf Masters BD — Where Champions Play. Experience premier artificial turf football with modern facilities and unforgettable moments.
                                </p>
                            </div>
                        </div>
                        <div className='footer__column'>
                            <h3 className='footer__column-heading'>SUPPORT AND RESOURCES</h3>
                            <nav className='footer__column-nav-wrap'>
                                <Link href='/contactus'>
                                    <span className='footer__column-nav-item'>Contact Us</span>
                                </Link>
                                <Link href='/refund-and-cancellation'>
                                    <span className='footer__column-nav-item'>Refund And Cancellation</span>
                                </Link>
                                <Link href='/facilities'>
                                    <span className='footer__column-nav-item'>Facilities</span>
                                </Link>
                                <Link href='/gallery'>
                                    <span className='footer__column-nav-item'>Photo Gallery</span>
                                </Link>
                                <Link href='/booking'>
                                    <span className='footer__column-nav-item'>Book Now</span>
                                </Link>
                            </nav>
                        </div>
                        <div className='footer__column'>
                            <h3 className='footer__column-heading'>INFORMATION</h3>
                            <nav className='footer__column-nav-wrap'>
                                <Link href='/aboutus' className='footer__column-nav-item-link'>
                                    <span className='footer__column-nav-item'>About Us</span>
                                </Link>
                                <Link href='/dashboard' className='footer__column-nav-item-link'>
                                    <span className='footer__column-nav-item'>My Account</span>
                                </Link>
                                <Link href='/privacy-policy' className='footer__column-nav-item-link'>
                                    <span className='footer__column-nav-item'>Privacy Policy</span>
                                </Link>
                                <Link href='/terms-and-conditions' className='footer__column-nav-item-link'>
                                    <span className='footer__column-nav-item'>Terms And Conditions</span>
                                </Link>
                                <Link href='/booking'>
                                    <span className='footer__column-nav-item'>Book Now</span>
                                </Link>
                            </nav>
                        </div>
                        <div className='footer__column'>
                            <h3 className='footer__column-heading'>LOCATION</h3>
                            <address className='footer__address-text'>Shetu Housing, Sector 17, Uttara, Dhaka, Bangladesh, 1230</address>
                            <div className='footer__contact-wrap'>
                                <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.556 10.906L12.101 11.359C12.101 11.359 11.018 12.435 8.063 9.49698C5.108 6.55898 6.191 5.48298 6.191 5.48298L6.477 5.19698C7.184 4.49498 7.251 3.36698 6.634 2.54298L5.374 0.859979C4.61 -0.160021 3.135 -0.29502 2.26 0.57498L0.690002 2.13498C0.257002 2.56698 -0.0329985 3.12498 0.00200151 3.74498C0.0920015 5.33198 0.810001 8.74498 4.814 12.727C9.061 16.949 13.046 17.117 14.675 16.965C15.191 16.917 15.639 16.655 16 16.295L17.42 14.883C18.38 13.93 18.11 12.295 16.882 11.628L14.972 10.589C14.166 10.152 13.186 10.28 12.556 10.906Z" fill="white" />
                                </svg>
                                <Link href='tel: 01901644240' ><span className='footer__content-text'>Turf Masters BD : 01901644240</span></Link>
                            </div>

                            <div className='footer__contact-wrap'>
                                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.616 14C1.15533 14 0.771 13.846 0.463 13.538C0.155 13.23 0.000666667 12.8453 0 12.384V1.616C0 1.15533 0.154333 0.771 0.463 0.463C0.771667 0.155 1.15567 0.000666667 1.615 0H16.385C16.845 0 17.229 0.154333 17.537 0.463C17.845 0.771666 17.9993 1.156 18 1.616V12.385C18 12.845 17.8457 13.2293 17.537 13.538C17.2283 13.8467 16.8443 14.0007 16.385 14H1.616ZM9 7.116L17 1.885L16.692 1L9 6L1.308 1L1 1.885L9 7.116Z" fill="white" />
                                </svg>
                                <Link href='mailto: turfmastersbd@gmail.com' target='_blannk'><span className='footer__content-text'>turfmastersbd@gmail.com</span></Link>
                            </div>
                            <div className='footer__social-wrap'>
                                <Link href='https://www.facebook.com/turfmastersuttara' target='_blank' className='footer__social-item-link'>
                                    <span className='visually-hidden'>facebook</span>
                                    <svg className='footer__social-item' width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 10C20 4.48 15.52 0 10 0C4.48 0 0 4.48 0 10C0 14.84 3.44 18.87 8 19.8V13H6V10H8V7.5C8 5.57 9.57 4 11.5 4H14V7H12C11.45 7 11 7.45 11 8V10H14V13H11V19.95C16.05 19.45 20 15.19 20 10Z" fill="#ffffff" />
                                    </svg>
                                </Link>
                                {/* <Link href='https://www.instagram.com/mymensinghturf' target='_blank' className='footer__social-item-link'>
                                    <span className='visually-hidden'>Instagram</span>
                                    <svg className='footer__social-item' width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M5.8 0H14.2C17.4 0 20 2.6 20 5.8V14.2C20 15.7383 19.3889 17.2135 18.3012 18.3012C17.2135 19.3889 15.7383 20 14.2 20H5.8C2.6 20 0 17.4 0 14.2V5.8C0 4.26174 0.61107 2.78649 1.69878 1.69878C2.78649 0.61107 4.26174 0 5.8 0ZM5.6 2C4.64522 2 3.72955 2.37928 3.05442 3.05442C2.37928 3.72955 2 4.64522 2 5.6V14.4C2 16.39 3.61 18 5.6 18H14.4C15.3548 18 16.2705 17.6207 16.9456 16.9456C17.6207 16.2705 18 15.3548 18 14.4V5.6C18 3.61 16.39 2 14.4 2H5.6ZM15.25 3.5C15.5815 3.5 15.8995 3.6317 16.1339 3.86612C16.3683 4.10054 16.5 4.41848 16.5 4.75C16.5 5.08152 16.3683 5.39946 16.1339 5.63388C15.8995 5.8683 15.5815 6 15.25 6C14.9185 6 14.6005 5.8683 14.3661 5.63388C14.1317 5.39946 14 5.08152 14 4.75C14 4.41848 14.1317 4.10054 14.3661 3.86612C14.6005 3.6317 14.9185 3.5 15.25 3.5ZM10 5C11.3261 5 12.5979 5.52678 13.5355 6.46447C14.4732 7.40215 15 8.67392 15 10C15 11.3261 14.4732 12.5979 13.5355 13.5355C12.5979 14.4732 11.3261 15 10 15C8.67392 15 7.40215 14.4732 6.46447 13.5355C5.52678 12.5979 5 11.3261 5 10C5 8.67392 5.52678 7.40215 6.46447 6.46447C7.40215 5.52678 8.67392 5 10 5ZM10 7C9.20435 7 8.44129 7.31607 7.87868 7.87868C7.31607 8.44129 7 9.20435 7 10C7 10.7956 7.31607 11.5587 7.87868 12.1213C8.44129 12.6839 9.20435 13 10 13C10.7956 13 11.5587 12.6839 12.1213 12.1213C12.6839 11.5587 13 10.7956 13 10C13 9.20435 12.6839 8.44129 12.1213 7.87868C11.5587 7.31607 10.7956 7 10 7Z" fill="#ffffff" />
                                    </svg>
                                </Link> */}
                                {/* <Link href='https://www.tiktok.com/@skyturf0?is_from_webapp=1&sender_device=pc' target='_blank' className='footer__social-item-link'>
                                    <span className='visually-hidden'>Tiktok</span>
                                    <svg width="18" height="20" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12.6 2.82C11.9166 2.03953 11.5399 1.0374 11.54 0H8.45V12.4C8.42666 13.0712 8.14352 13.7071 7.66031 14.1735C7.17709 14.6399 6.5316 14.9004 5.86 14.9C4.44 14.9 3.26 13.74 3.26 12.3C3.26 10.58 4.92 9.29 6.63 9.82V6.66C3.18 6.2 0.16 8.88 0.16 12.3C0.16 15.63 2.92 18 5.85 18C8.99 18 11.54 15.45 11.54 12.3V6.01C12.793 6.90985 14.2974 7.39265 15.84 7.39V4.3C15.84 4.3 13.96 4.39 12.6 2.82Z" fill="#ffffff" />
                                    </svg>
                                </Link> */}
                            </div>
                        </div>
                    </div>
                    <div className='footer__copyright'>
                        <p className='footer__copyright-text'>© All Rights Reserve by Turf Masters BD, 2026 made by &nbsp;
                            <Link href="https://www.linkedin.com/in/minhazul-abedin-siam-08286012a/" target='_blank'>
                                <span className='footer__copyright-text footer__copyright-text--underline'>Minhazul Abedin</span>
                            </Link>
                        </p>
                    </div>
                </div>
            </footer>
        </>
    )
}

export default Footer