#Module 9

#Challenge 2

'''
def predictor( row ):
	m_mode = 'Yes'
	h_mode = '1'
	grad = row['Education']  # no empties
	area = row['Property_Area']  # no empties
	married = row['Married'] if row['Married'] != '' else m_mode
	history = row['Credit_History'] if row['Credit_History'] != '' else h_mode
		
	if grad == 'Graduate':
		if history == '1':
			return 'Y'
		else:
			return 'N'
	else:
		if area != 'Rural':
			if married == 'Yes':
				return 'Y'
			else:
				return 'N'
		else:
			return 'N'

	raise ValueError('No leaf reached for row: ' + row)
	cases = [[predictor(row), row['Loan_Status']] for row in loan_table]

'''
import sys
import json

def report( name, shortd, longd):
	d = {'Name': name, 'Short': shortd, 'Long': str(longd)}
	print(json.dumps(d))

#Mock data goes first

import pandas as pd
xurl = 'https://docs.google.com/spreadsheets/d/1_artlzgoj6pDBCBfdt9-Jmc9RT9yLsZ0vTnk3zJmt_E/pub?gid=1291197392&single=true&output=csv'
xdf = pd.read_csv(xurl)  # reads in the data from web
xdf_fill = xdf.fillna('') # replace empty values with empty string 
xdf_dict = xdf_fill.T.to_dict() # create dictionary

xloan_table  = xdf_dict.values() # convert to final form

loan_table = xloan_table

try:
	# Here lies the new code
	with open(sys.argv[1], 'r') as fin:
		function = fin.read()
		exec(function)

except Exception as e:
	report('Generic error', 'On your own', e)
	sys.exit(1)

try:
	predictor		# does var exist?
except NameError as e:
	report('Name error', 'Typically a typo', e)
	sys.exit(1)

if not callable(predictor):
	report('Data type bug', 'predictor is not a function - review function syntax', 'No further help available')
	sys.exit(1)

try:
	ucases = [(predictor(row), row['Loan_Status']) for row in loan_table]
except Exception as e:
	report('Generic error', 'Problem calling predictor function', e)
	sys.exit(1)

if len(ucases) != len(loan_table):
	report('Length bug', 'Not predicting a value for every row', 'No further help available')
	sys.exit(1)

def xpredictor( row ):
	m_mode = 'Yes'
	h_mode = 1
	grad = row['Education']  # no empties
	area = row['Property_Area']  # no empties
	married = row['Married'] if row['Married'] != '' else m_mode
	history = row['Credit_History'] if row['Credit_History'] != '' else h_mode

	if grad == 'Graduate':
		if history == 1:
			return 'Y'
		else:
			return 'N'
	else:
		if area != 'Rural':
			if married == 'Yes':
				return 'Y'
			else:
				return 'N'
		else:
			return 'N'

	raise ValueError('No leaf reached for row: ' + row)

xcases = [(xpredictor(row), row['Loan_Status']) for row in loan_table]

if 	xcases != ucases:
	report('Value bug', 'The 4 cases do not match target', 'No further help available')
	sys.exit(1)

