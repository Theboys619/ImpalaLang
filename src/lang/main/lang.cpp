struct ImpalaNumber {
  int a;
  float b;

  int type;

  ImpalaNumber() {};

  ImpalaNumber(int x) {
    a = x;
    type = 1;
  }
  ImpalaNumber(float x) {
    b = x;
    type = 0;
  }
  ImpalaNumber(double x) {
    b = (float)x;
    type = 0;
  }


  int operator+= (int x) {
    a += x;
    type = 1;
    return a;
  }
  float operator+= (float x) {
    b += x;
    type = 1;
    return b;
  }


  int operator= (int x) {
    a = x;
    type = 1;
    return a;
  }
  float operator= (float x) {
    b = x;
    a = 0;
    type = 0;
    return b;
  }
  float operator= (double x) {
    b = (float)x;
    a = 0;
    type = 0;
    return b;
  }


  bool operator< (int x) {
    return a < x;
  }
  bool operator< (float x) {
    return b < x;
  }
  bool operator< (ImpalaNumber x) {
    if (type == 1) {
      return a < x.a;
    } else {
      return b < x.b;
    }
  }


  bool operator> (int x) {
    return a > x;
  }
  bool operator> (float x) {
    return b > x;
  }
  bool operator> (ImpalaNumber x) {
    if (type == 1) {
      return a > x.a;
    } else {
      return b > x.b;
    }
  }


  bool operator<= (int x) {
    return a <= x;
  }
  bool operator<= (float x) {
    return b <= x;
  }
  bool operator<= (ImpalaNumber x) {
    if (type == 1) {
      return a <= x.a;
    } else {
      return b <= x.b;
    }
  }


  bool operator>= (int x) {
    return a >= x;
  }
  bool operator>= (float x) {
    return b >= x;
  }
  bool operator>= (ImpalaNumber x) {
    if (type == 1) {
      return a >= x.a;
    } else {
      return b >= x.b;
    }
  }

  
  bool operator== (ImpalaNumber x) {
    if (type == 1) {
      return a == x.a;
    } else {
      return b == x.b;
    }
  }


  ImpalaNumber operator- (ImpalaNumber x) {
    if (type == 1) {
      return ImpalaNumber(a - x.a);
    }

    return ImpalaNumber(b - x.b);
  }


  ImpalaNumber operator+ (ImpalaNumber x) {
    if (type == 1) {
      return ImpalaNumber(a + x.a);
    }

    return ImpalaNumber(b + x.b);
  }


  ImpalaNumber operator* (ImpalaNumber x) {
    if (type == 1) {
      return ImpalaNumber(a * x.a);
    }

    return ImpalaNumber(b * x.b);
  }


  ImpalaNumber operator/ (ImpalaNumber x) {
    if (type == 1) {
      return ImpalaNumber(a / x.a);
    }

    return ImpalaNumber(b / x.b);
  }


  std::variant<int, float> operator++ () {
    if (type == 0) {
      return b++;
    }

    return a++;
  }

  int operator++ (int) {
    return ++a;
  }

  std::string operator<< (std::string x) {
    if (type == 1) {
      return x + std::string(sizeof(a), a);
    } else {
      return x + std::string(sizeof(b), b);
    }
  }
};

struct ImpalaObject {
  ImpalaObject() {
    
  }
};

struct ImpalaAny {
  ImpalaObject obj;
  ImpalaNumber num;
  const char*  str;
  bool         bln;

  int type;

  // ImpalaAny(ImpalaObject iObj) {
  //   type = 0;
  //   obj = iObj;
  // }
  ImpalaAny(ImpalaNumber iNum) {
    type = 1;
    num = iNum;
  }
  ImpalaAny(const char* iStr) {
    type = 2;
    str = iStr;
  }
  ImpalaAny(bool iBln) {
    type = 3;
    bln = iBln;
  }

  // ImpalaNumber //

  bool operator== (ImpalaNumber x) {
    if (type == 1) {
      if (num.type == 1) {
        return num.a == x.a;
      }

      return num.b == x.b;
    }

    return false;
  }
  bool operator> (ImpalaNumber x) {
    if (type == 1) {
      if (num.type == 1) {
        return num.a > x.a;
      } else {
        return num.b > x.b;
      }
    }

    return false;
  }
  bool operator>= (ImpalaNumber x) {
    if (type == 1) {
      if (num.type == 1) {
        return num.a >= x.a;
      } else {
        return num.b >= x.b;
      }
    }

    return false;
  }
  bool operator< (ImpalaNumber x) {
    if (type == 1) {
      if (num.type == 1) {
        return num.a < x.a;
      } else {
        return num.b < x.b;
      }
    }

    return false;
  }
  bool operator<= (ImpalaNumber x) {
    if (type == 1) {
      if (num.type == 1) {
        return num.a <= x.a;
      } else {
        return num.b <= x.b;
      }
    }

    return false;
  }

  ImpalaNumber operator+= (ImpalaNumber x) {
    if (type == 1) {
      if (num.type == 1) {
        if (x.type == 0) {
          num.b = (float)num.a + (float)x.b;
        } else {
          num.a += x.a;
        }
        return num;
      } else {
        if (x.type == 1) {
          num.b += x.a;
        } else {
          num.b += x.b;
        }
        return num;
      }
    }

    throw "Cannot increment a non number";
  }
  ImpalaNumber operator++ () {
    if (type == 1) {
      if (num.type == 1) {
        num.a++;
        return num;
      } else {
        num.b++;
        return num;
      }
    }

    throw "Cannot increment a non number";
  }
  ImpalaNumber operator++ (int) {
    if (type == 1) {
      if (num.type == 1) {
        ++num.a;
        return num;
      } else {
        ++num.b;
        return num;
      }
    }

    throw "Cannot increment a non number";
  }

  ImpalaNumber operator- (ImpalaNumber x) {
    if (type == 1) {
      if (num.type == 1) {
        return ImpalaNumber(num.a - x.a);
      }

      return ImpalaNumber(num.b - x.b);
    }

    return false;
  }
  ImpalaNumber operator+ (ImpalaNumber x) {
    if (type == 1) {
      if (num.type == 1) {
        return ImpalaNumber(num.a + x.a);
      }

      return ImpalaNumber(num.b + x.b);
    }

    return false;
  }
  ImpalaNumber operator* (ImpalaNumber x) {
    if (type == 1) {
      if (num.type == 1) {
        return ImpalaNumber(num.a * x.a);
      }

      return ImpalaNumber(num.b * x.b);
    }

    return false;
  }
  ImpalaNumber operator/ (ImpalaNumber x) {
    if (type == 1) {
      if (num.type == 1) {
        return ImpalaNumber(num.a / x.a);
      }

      return ImpalaNumber(num.b / x.b);
    }

    return false;
  }


  std::string operator<< (std::string x) {
    if (type == 0) {
      // return x + std::string(sizeof(obj), obj);
      return x;
    } else if (type == 1) {
      if (num.type == 0) {
        return x + std::string(sizeof(num.a), num.a);
      } else {
        return x + std::string(sizeof(num.b), num.b);
      }
    } else if (type == 2) {
      return x + str;
    } else {
      if (bln == 1)
        return x + "true";
      
      return x + "false";
    }
  }

};