'use client';

import React from 'react';
import styles from './LotusLoader.module.css';

interface LotusLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export default function LotusLoader({
  label = 'Loading',
  fullScreen = true,
}: LotusLoaderProps) {
  return (
    <div
      className={`${styles.lotusLoader} ${fullScreen ? '' : styles.lotusLoaderRelative}`}
      role="status"
      aria-label={label}
    >
      <div className={styles.lotusOrbit}>
        <span className={`${styles.orbitDot} ${styles.dot1}`} />
        <span className={`${styles.orbitDot} ${styles.dot2}`} />
        <span className={`${styles.orbitDot} ${styles.dot3}`} />
        <span className={`${styles.orbitDot} ${styles.dot4}`} />
      </div>

      <div className={styles.lotusFlower}>
        <span className={styles.lotusPetal} style={{ ['--i' as any]: 0 }} />
        <span className={styles.lotusPetal} style={{ ['--i' as any]: 1 }} />
        <span className={styles.lotusPetal} style={{ ['--i' as any]: 2 }} />
        <span className={styles.lotusPetal} style={{ ['--i' as any]: 3 }} />
        <span className={styles.lotusPetal} style={{ ['--i' as any]: 4 }} />
        <span className={styles.lotusPetal} style={{ ['--i' as any]: 5 }} />
        <span className={styles.lotusPetal} style={{ ['--i' as any]: 6 }} />
        <span className={styles.lotusPetal} style={{ ['--i' as any]: 7 }} />

        <div className={styles.lotusCore}>
          <span />
        </div>
      </div>

      <div className={styles.lotusShadow} />
      <p className={styles.lotusLabel}>
        {label}
        <span className={styles.loadingDots} />
      </p>
    </div>
  );
}
