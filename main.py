from bottle import route, run, template, static_file, get, post, request
import json
import pymysql
import os

# Connect to the database

# connection = pymysql.connect(host='us-cdbr-iron-east-04.cleardb.net',
#                              user='bf0322fb12a331',
#                              password='97028153',
#                              db='heroku_19fdd981997ff6d',
#                              charset='utf8',
#                              cursorclass=pymysql.cursors.DictCursor)

connection = pymysql.connect(host='localhost',
                             user='root',
                             password='',
                             db='adventure-3',
                             charset='utf8',
                             cursorclass=pymysql.cursors.DictCursor)


@route("/", method="GET")
def index():
    return template("adventure.html")


@route("/addUser", method="POST")
def add_user():
    username = request.POST.get("username")
    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO `adventure-3`.`user` (`idusers`, `user_name`, `curr_question`, `user_coins`, `user_life`) " \
                  "VALUES (NULL, '{0}', '1', '100', '100');".format(username)
            cursor.execute(sql)
            connection.commit()
    except Exception as e:
        print("you failed because of " + repr(e))
    return json.dumps({"question_num": "",
                       "question_text": "",
                       "answers": [],
                       "image": "choice.jpg"
                       })


def user_exists(username):
    try:
        with connection.cursor() as cursor:
            sql = "SELECT * FROM user " \
                  "WHERE user_name = '{0}'".format(username)
            cursor.execute(sql)
            result = cursor.fetchone()  # returns None if there was no match!
            if result:
                return True
            else:
                return False
    except Exception as e:
        print("hello")
        print("you failed because of " + repr(e))
    return None


@route("/checkUserCredentials", method="POST")
def check_user_credentials():
    username = request.POST.get("username")
    if user_exists(username):
        return json.dumps({"already_exists": 1})
    else:
        return json.dumps({"already_exists": 0})


@route("/start", method="POST")
def start():
    username = request.POST.get("username")
    return json.dumps({"question_num": "",
                       "question_text": "",
                       "answers": [],
                       "image": "choice.jpg"
                       })


def get_user(username):
    try:
        with connection.cursor() as cursor:
            sql = "SELECT * FROM user WHERE user_name = '{0}'".format(username)
            cursor.execute(sql)
            return cursor.fetchone()
    except Exception as e:
        print("Failed because of " + repr(e))


def get_question_text(question_id):
    try:
        with connection.cursor() as cursor:
            sql = "SELECT question_text FROM question WHERE question_id = '{0}'".format(question_id)
            cursor.execute(sql)
            return cursor.fetchone()
    except Exception as e:
        print("Failed because of " + repr(e))


def get_answers_for_question(question_id):
    try:
        with connection.cursor() as cursor:
            sql = "SELECT qa.answer_id, answer_text " \
                  "FROM q_a_link qa " \
                  "LEFT JOIN answer a " \
                  "ON qa.answer_id = a.answer_id " \
                  "WHERE qa.question_id = '{0}'".format(question_id)
            cursor.execute(sql)
            return cursor.fetchall()
    except Exception as e:
        print("Failed because of " + repr(e))


def get_question_image(question_id):
    try:
        with connection.cursor() as cursor:
            sql = "SELECT image FROM question WHERE question_id = '{0}'".format(question_id)
            cursor.execute(sql)
            return cursor.fetchone()
    except Exception as e:
        print("Failed because of " + repr(e))


@route("/printQuestion", method="POST")
def print_question():
    username = request.POST.get("username")

    user = get_user(username)
    # only get next question for user if it exists
    if user["curr_question"] != -1:
        question_text = get_question_text(user["curr_question"])
        image_src = get_question_image(user["curr_question"])
        answer_list = get_answers_for_question(user["curr_question"])
        return json.dumps({"question_text": question_text["question_text"],
                           "answers": answer_list,
                           "image": image_src["image"],
                           "end_reached": 0,
                           "coins": user["user_coins"],
                           "life": user["user_life"]
                           })
    else:
        # end has been reached
        user = get_user(username)
        return json.dumps({"end_reached": 1,
                           "user": user})


def get_answer_data(answer_id):
    try:
        with connection.cursor() as cursor:
            sql = "SELECT * FROM answer WHERE answer_id = '{0}'".format(answer_id)
            cursor.execute(sql)
            return cursor.fetchone()
    except Exception as e:
        print("Failed because of " + repr(e))


def update_user_coins(username, coins_to_deduct):
    user = get_user(username)
    new_coin_amt = max(int(user["user_coins"]) - int(coins_to_deduct), 0)
    try:
        with connection.cursor() as cursor:
            sql = "UPDATE user SET user_coins='{0}' WHERE user_name = '{1}'".format(new_coin_amt, username)
            cursor.execute(sql)
            connection.commit()
    except Exception as e:
        print("you failed because of " + repr(e))
    return None


def update_user_life(username, life_to_deduct):
    user = get_user(username)
    new_life_amt = max(min(int(user["user_life"]) - int(life_to_deduct), 100), 0)  # restrict between 0 and 100 percent
    try:
        with connection.cursor() as cursor:
            sql = "UPDATE user SET user_life ='{0}' WHERE user_name = '{1}'".format(new_life_amt, username)
            cursor.execute(sql)
            connection.commit()
    except Exception as e:
        print("you failed because of " + repr(e))
    return None


def update_user_curr_question(username, new_curr_question):
    try:
        with connection.cursor() as cursor:
            sql = "UPDATE user SET curr_question ='{0}' WHERE user_name = '{1}'".format(new_curr_question, username)
            cursor.execute(sql)
            connection.commit()
    except Exception as e:
        print("you failed because of " + repr(e))
    return None


def update_user_data(username, answer_data):
    update_user_coins(username, answer_data["answer_coins"])
    update_user_life(username, answer_data["answer_life"])
    update_user_curr_question(username, answer_data["next_question_id"])


@route("/handleOptionSelection", method="POST")
def handle_option_selection():
    username = request.POST.get("username")
    answer_id = request.POST.get("choice")

    answer_data = get_answer_data(answer_id)
    update_user_data(username, answer_data)
    user = get_user(username)
    return json.dumps({"user": user})


@route("/setDetailsForLoser", method="POST")
def set_details_for_loser():
    username = request.POST.get("username")
    update_user_coins(username, 999)  # make it that he loses more coins than he could possibly have
    update_user_life(username, 100)
    update_user_curr_question(username, -1)


@route('/js/<filename:re:.*\.js$>', method='GET')
def javascripts(filename):
    return static_file(filename, root='js')


@route('/css/<filename:re:.*\.css>', method='GET')
def stylesheets(filename):
    return static_file(filename, root='css')


@route('/images/<filename:re:.*\.(jpg|png|gif|ico)>', method='GET')
def images(filename):
    return static_file(filename, root='images')


def main():
    # if os.environ.get('APP_LOCATION') == 'heroku':
    # run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
    # else:
    run(host='localhost', port=8080, debug=True)
    add_user()


if __name__ == '__main__':
    main()

