#include <string>
#include <variant>
#include <chrono>
#include <cstring>
#include <algorithm>

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


#include <iostream>

/* Log Function */
void log(std::string msg) {
  std::cout << msg << std::endl;
}
void log(const char* msg) {
  std::cout << msg << std::endl;
}
void log(int msg) {
  std::cout << msg << std::endl;
}
void log(float msg) {
  std::cout << msg << std::endl;
}
void log(bool msg) {
  std::string boolstr = "false";
  if (msg == true) boolstr = "true";
  std::cout << boolstr << std::endl;
}
void log(ImpalaNumber msg) {
  if (msg.type == 1) {
    std::cout << msg.a << std::endl;
  } else {
    std::cout << msg.b << std::endl;
  }
}
void log(ImpalaAny msg) {
  if (msg.type == 1) {
    if (msg.num.type == 1)
      std::cout << msg.num.a << std::endl;
    else
      std::cout << msg.num.b << std::endl;
  } else if (msg.type == 2) {
    std::cout << msg.str << std::endl;
  } else {
    std::string boolstr = "false";
    if (msg.bln == true) boolstr = "true";
    std::cout << boolstr << std::endl;
  }
}
template <typename T, typename ... Args>
void log(T arg, Args... args) {
  std::cout << arg << " ";

  log(args...);

  std::cout << "\n";
}

/* Input Function */
std::string stdcin() {
  std::string msg;
  std::cin >> msg;

  return msg;
}

ImpalaNumber fact(ImpalaNumber x) {
if (x == ImpalaNumber(1)) {
return ImpalaNumber(1);

}
return x * fact(x - ImpalaNumber(1));

}

int main(int argc, char** argv) {
  std::chrono::steady_clock::time_point begin = std::chrono::steady_clock::now();
log(fact(fact(ImpalaNumber(2))));

  if (std::strcmp(argv[1], "--time") == 0) {
    std::chrono::steady_clock::time_point end = std::chrono::steady_clock::now();
    std::cout << std::endl << "Program finished in: " << std::chrono::duration_cast<std::chrono::nanoseconds> (end - begin).count() * 1e-9 << " seconds (C++ Actual)" << std::endl;
  };
  return 0;
}