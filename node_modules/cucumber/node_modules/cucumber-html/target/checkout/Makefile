release: release-jar release-npm

release-jar:
	@(echo | gpg -ab --batch > /dev/null 2>&1) || (echo "ERROR: gpg-agent not running"; /bin/false)
	mvn release:clean
	mvn --batch-mode -P release-sign-artifacts release:prepare
	mvn --batch-mode -P release-sign-artifacts release:perform
	@echo "************ CLOSE and RELEASE at https://oss.sonatype.org/index.html#stagingRepositories ************"

release-npm:
	npm publish

.PHONY: release release-jar
