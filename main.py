from bottle import route, run, template, static_file, get, post, request
import random
import json
import pymysql


# Connect to the database
connection = pymysql.connect(host='localhost',
                             user='root',
                             password='',
                             db='adventure-final',
                             charset='utf8',
                             cursorclass=pymysql.cursors.DictCursor)


@route("/", method="GET")
def index():
    return template("adventure.html")


@route("/start", method="POST")
def start():
    username = request.POST.get("username")
    password = request.POST.get("password")
    gender = request.POST.get("gender")
    current_adv_id = request.POST.get("adventure_id")
    print(username, password, gender, current_adv_id)
    # TODO: before adding user

    try:
        with connection.cursor() as cursor:
            sql = "INSERT INTO `adventure-final`.`users` (`idusers`, `user_name`, `password`, `curr_question`, `user_coins`, `user_life`, `gender`) " \
                  "VALUES (NULL, '{0}','{1}', '1', '100', '100','{2}');".format(username, password, gender)
            cursor.execute(sql)
            connection.commit()
            print("user added!")
    except Exception as e:
        print("you failed")
    return json.dumps({"question_num": "",
                       "question_text": "",
                       "answers": [],
                       "image": "choice.jpg"
                       })


@route("/story", method="POST")
def story():
    username = request.POST.get("username")
    # get question_num, question_text, list_of_answers using SQL queries, and all we actually care about is the username
    try:
        with connection.cursor() as cursor:
            sql = "SELECT curr_question FROM users WHERE user_name = '{0}'".format(username)
            cursor.execute(sql)

            question_num = cursor.fetchone()['curr_question']

            sql = "SELECT question_text FROM questions WHERE idquestions = '{0}'".format(question_num)
            cursor.execute(sql)
            question_text = cursor.fetchone()['question_text']

            sql = "SELECT next_answer_id, answer_text FROM qa_link ql INNER JOIN answers " \
                  "ON ql.next_answer_id = answers.idanswers " \
                  "WHERE ql.prev_question_id = -1 and ql.prev_answer_id = -1"
            cursor.execute(sql)
            list_of_answers = cursor.fetchall()
            print(list_of_answers)
        # TODO: add customised images to each question
        return json.dumps({"question_num": question_num,
                           "question_text": question_text,
                           "answers": list_of_answers,
                           "image": "choice.jpg"
                           })
    except Exception as e:
        return json.dumps({'error': 'something is wrong with the DB ' + repr(e)})



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
    run(host='localhost', port=9000)


if __name__ == '__main__':
    main()

