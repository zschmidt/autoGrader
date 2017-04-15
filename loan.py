
import pandas as pd # helps with handling csv formatted data

url = 'https://docs.google.com/spreadsheets/d/1_artlzgoj6pDBCBfdt9-Jmc9RT9yLsZ0vTnk3zJmt_E/pub?gid=1291197392&single=true&output=csv'

df = pd.read_csv(url)  # reads in the data from web

df_fill = df.fillna('') # replace empty values with empty string 

df_dict = df_fill.T.to_dict() # create dictionary

loan_table  = df_dict.values() # convert to final form

first_row = loan_table[0]


# print(first_row)

income =  [row['ApplicantIncome'] for row in loan_table]

sum_income = sum(income)


average_income = sum_income / len(loan_table)


def predictor(row):
	if row['Credit_History'] == 1:
		return 'Y'
	else:
		return 'N'


challenge_predictions = [predictor(row) for row in loan_table]
golden_values = [row['Loan_Status'] for row in loan_table] # what really happened
zipped = zip(challenge_predictions, golden_values) # combine the 2 lists like a zipper
pos_correct = zipped.count(('Y', 'Y')) # ('Y', 'Y') means prediction matches reality
neg_correct = zipped.count(('N', 'N')) # ('N', 'N') means prediction matches reality
total_correct = pos_correct + neg_correct
accuracy = 1.0*total_correct/len(loan_table)


print(accuracy)


# Plot a thing

# import matplotlib.pyplot as plt 
# loan_amount_term = [row['Loan_Amount_Term'] for row in loan_table if row['Loan_Amount_Term'] != '']  # step 1
# plt.hist(loan_amount_term, 5)  # step 2
# plt.xlabel("Loan Term (in months)")  # one step on assembly line
# plt.ylabel("Number of applicants")  # one step on assembly line
# plt.title("Loan Term of Applicants")
# plt.show() 