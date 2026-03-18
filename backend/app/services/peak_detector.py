"""
고점 / 저점 자동 탐지 알고리즘

scipy.signal.argrelextrema 기반.
봉 종류별 기본 N값:
  분봉: 20 / 일봉: 10 / 주봉: 5 / 월봉: 3
민감도 슬라이더: N=5(민감) ~ N=30(둔감)
"""
import numpy as np
from scipy.signal import argrelextrema


def find_peaks(prices: list[float], n: int = 10) -> list[int]:
    """고점 인덱스 반환 (prices 리스트 기준)

    Args:
        prices: 종가 또는 고가 리스트
        n: 비교 범위. 클수록 큰 고점만 탐지
    """
    arr = np.array(prices)
    indices = argrelextrema(arr, np.greater, order=n)[0]
    return indices.tolist()


def find_valleys(prices: list[float], n: int = 10) -> list[int]:
    """저점 인덱스 반환

    Args:
        prices: 종가 또는 저가 리스트
        n: 비교 범위. 클수록 큰 저점만 탐지
    """
    arr = np.array(prices)
    indices = argrelextrema(arr, np.less, order=n)[0]
    return indices.tolist()


# 봉 종류별 기본 N값
DEFAULT_N: dict[str, int] = {
    "분봉": 20,
    "30분": 20,
    "60분": 20,
    "일봉": 10,
    "주봉": 5,
    "월봉": 3,
}
