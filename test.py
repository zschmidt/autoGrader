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