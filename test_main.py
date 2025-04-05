import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from main import main

def test_main():
    assert callable(main)