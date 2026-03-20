import React from "react";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>Cricket Intelligence</span>
        <span className={styles.divider}>·</span>
        <span className={styles.copy}>© {new Date().getFullYear()} All rights reserved</span>
      </div>
    </footer>
  );
};

export default Footer;