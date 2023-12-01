from faker import Faker
import random

fake = Faker('zh_CN')  # 使用中文

# 生成随机的书籍信息
def generate_random_book():
    bCnt = random.randint(1, 100)
    bRemaining = random.randint(1, bCnt)

    return {
        'bID': fake.pystr(max_chars=10),
        'bName': fake.pystr(max_chars=10),
        'bPub': fake.pystr(max_chars=10),
        'bDate': fake.date(),
        'bAuthor': fake.pystr(max_chars=10),
        'bMem': fake.pystr(max_chars=10),
        'bCnt': bCnt,
        'bRemaining': bRemaining,
    }

# 生成随机的读者信息
def generate_random_reader():
    return {
        'rID': fake.pystr(max_chars=10),
        'rName': fake.pystr(max_chars=10),
        'rSex': random.choice(['男', '女']),
        'rDept': fake.pystr(max_chars=10),
        'rGrade': random.randint(1, 12),
    }

# 生成多个随机书籍和读者信息
def generate_random_data(book_count, reader_count):
    books = [generate_random_book() for _ in range(book_count)]
    readers = [generate_random_reader() for _ in range(reader_count)]
    return books, readers

# 示例：生成5本书和3个读者的信息
books, readers = generate_random_data(20, 10)

print('生成的随机书籍信息：')
for book in books:
    print(book)

print('\n生成的随机读者信息：')
for reader in readers:
    print(reader)
